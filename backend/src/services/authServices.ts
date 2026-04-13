import { ConflictError, NotFoundError, UnauthorizedError } from "../helpers/errors/domain.errors";
import { UserWithCredentials } from "../schemas/user.schema";
import { User } from "../entities/User.entity";
import { AppDataSourceProd } from "../database/dataBaseDev";
import { Credential } from "../entities/Credential.entity";
import { sign } from 'hono/jwt'
import { CredentialSchema } from "../schemas/credential.schema";
import 'dotenv/config'
import { Account } from "../entities/Account.entity";
import { TypeAccount, TypeCode } from "../utils/Enums";
import { categoriesBase } from "../utils/categoriesBase";
import { Codes } from "../entities/Codes.entity";
import { sendEmail } from "./sendEmail";
import { verifyAccountCode } from "../utils/templates/verifyAccountCode";
import { ResetPasswordSchema, VerifySchema } from "../schemas/verify.schema";
import { resetPasswordTemplate } from "../utils/templates/resetPassword";
import { passwordReseted } from "../utils/templates/passworReseted";
import { mailVerifiedTemplate } from "../utils/templates/mailVerified";
import { templateHtmlVerifyAccount } from "../utils/templates/templateHtmlVerifyAccount";

export class AuthService {
	private userRepo = AppDataSourceProd.getRepository(User);
	private credentialRepo = AppDataSourceProd.getRepository(Credential);
	private accountRepo = AppDataSourceProd.getRepository(Account);
	private codesRepo = AppDataSourceProd.getRepository(Codes)


	async createUser(userData: UserWithCredentials) {
		const queryRunner = AppDataSourceProd.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();
		try {
			const existingUser = await this.credentialRepo.findOneBy({ email: userData.email });
			if (existingUser) {
				throw new ConflictError('Email already in use', { email: ["El email ya está en uso"] });
			}

			const phoneInUse = await this.userRepo.findOneBy({ phone: userData.phone });
			if (phoneInUse) {
				throw new ConflictError('Phone number already in use', { phone: ["El número de teléfono ya está en uso"] });
			}

			const credential: Credential = this.credentialRepo.create({ email: userData.email, password: await Bun.password.hash(userData.password) });
			await queryRunner.manager.save(credential);

			const user: User = this.userRepo.create({
				...userData,
				credential: credential
			});
			await queryRunner.manager.save(user);

			credential.user = user;
			await queryRunner.manager.save(credential);

			const accountCash: Account = this.accountRepo.create({
				name: "EFECTIVO",
				type: TypeAccount.CASH,
				icon: "Wallet",
				balance: 0,
				user: user
			})
			await queryRunner.manager.save(accountCash);

			categoriesBase.forEach(async (category) => {
				const newCategory = queryRunner.manager.create('Category', {
					...category,
					isBase: true,
					user: user
				});
				await queryRunner.manager.save(newCategory);
			});

			await queryRunner.commitTransaction();
			const data = await this.logingUser({ email: userData.email, password: userData.password });

			sendEmail({
				to: credential.email,
				subject: "Bienvenido, Por favor verifca tu cuenta!",
				html: templateHtmlVerifyAccount(user.name)
			});

			return data
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async logingUser(credentials: CredentialSchema) {
		const credential: Credential | null = await this.credentialRepo.findOne({
			where: { email: credentials.email },
			select: ['id', 'email', 'password'],
			relations: ['user']
		});
		if (!credential) {
			throw new NotFoundError('Invalid credentials');
		}
		const isPasswordValid = await Bun.password.verify(credentials.password, credential.password);
		if (!isPasswordValid) {
			throw new ConflictError('Invalid credentials');
		}
		const payload = {
			sub: credential.user.id,
			email: credential.email,
			role: credential.user.isAdmin ? 'admin' : 'user',
			exp: Math.floor(Date.now() / 1000) + 60 * 15000 // 15 min
		}

		const JWT_SECRET = process.env.JWT_SECRET
		if (!JWT_SECRET) {
			throw new NotFoundError("JWR_SECRET es requerido")
		}
		const token = await sign(payload, JWT_SECRET)

		return { payload, token };
	}

	ramdonNum() {
		return Math.floor(100000 + Math.random() * 900000).toString()
	}
	// Mensaje estándar para evitar enumeración de usuarios
	private readonly GENERIC_EMAIL_MSG = "Si el correo coincide con una cuenta activa, recibirás un código en unos instantes.";

	async verifyMailGenerate(email: string, ip: string) {
		const user = await this.userRepo.findOne({
			where: { credential: { email } }
		});

		// Retornamos mensaje genérico incluso si el usuario no existe
		if (!user) return this.GENERIC_EMAIL_MSG;
		if (user.is_verified) throw new ConflictError("El usuario ya verificó su cuenta");

		const code = this.ramdonNum();
		const code_hashed = await Bun.password.hash(code);

		const newCode = this.codesRepo.create({
			used: false,
			attemps: 0,
			user,
			type: TypeCode.VERIFY_ACCOUNT,
			expired_at: new Date(Date.now() + 10 * 60 * 1000),
			hash_code: code_hashed,
			ip_address: ip
		});

		await this.codesRepo.save(newCode);

		sendEmail({
			to: email,
			subject: "Verificación de Cuenta",
			html: verifyAccountCode(user.name, code)
		});

		return this.GENERIC_EMAIL_MSG;
	}

	async verifyMail(data: VerifySchema, currentIp: string) {
		const { email, code } = data;

		if (code.length !== 6) throw new ConflictError("El código debe tener 6 dígitos");

		const user = await this.userRepo.findOne({
			where: { credential: { email } }
		});

		if (!user) throw new NotFoundError("Error en la validación del código");

		const codeDb = await this.codesRepo.findOne({
			where: {
				user: { id: user.id },
				used: false,
				type: TypeCode.VERIFY_ACCOUNT
			},
			order: { createdAt: "DESC" }
		});

		if (!codeDb) throw new NotFoundError("No hay códigos pendientes");

		if (codeDb.expired_at.getTime() < Date.now()) throw new ConflictError("El código ha expirado");
		if (codeDb.attemps >= 3) throw new ConflictError("Límite de intentos superado. Genera uno nuevo.");

		const isCodeValid = await Bun.password.verify(code, codeDb.hash_code);

		if (!isCodeValid) {
			codeDb.attemps += 1;
			await this.codesRepo.save(codeDb);
			throw new UnauthorizedError("Código incorrecto");
		}

		codeDb.used = true;
		codeDb.ip_validation_address = currentIp;

		user.is_verified = true;

		await this.userRepo.save(user);
		await this.codesRepo.save(codeDb);

		sendEmail({
			to: email,
			subject: "Cuenta verificada correctamente",
			html: mailVerifiedTemplate(user.name)
		});

		return "Correo verificado correctamente";
	}

	async forgotPassword(email: string, ip: string) {
		const user = await this.userRepo.findOne({ where: { credential: { email } } });
		if (!user) return this.GENERIC_EMAIL_MSG;

		const code = this.ramdonNum();
		const hash_code = await Bun.password.hash(code);

		const recoveryCode = this.codesRepo.create({
			used: false,
			attemps: 0,
			user,
			type: TypeCode.RESET_PASSWORD,
			expired_at: new Date(Date.now() + 15 * 60 * 1000),
			hash_code,
			ip_address: ip
		});

		await this.codesRepo.save(recoveryCode);

		sendEmail({
			to: email,
			subject: "Solicitud de recuperación de Contraseña",
			html: resetPasswordTemplate(user.name, code)
		});

		return this.GENERIC_EMAIL_MSG;
	}

	async resetPassword(data: ResetPasswordSchema, currentIp: string) {
		const { email, code, newPassword } = data;

		const user = await this.userRepo.findOne({
			where: { credential: { email } },
			relations: ["credential"]
		});

		if (!user) throw new NotFoundError("Error en la solicitud");

		const codeDb = await this.codesRepo.findOne({
			where: { user: { id: user.id }, used: false, type: TypeCode.RESET_PASSWORD },
			order: { createdAt: "DESC" }
		});

		if (!codeDb || codeDb.attemps >= 3 || codeDb.expired_at.getTime() < Date.now()) {
			throw new ConflictError("Código inválido, expirado o bloqueado.");
		}

		const isCodeValid = await Bun.password.verify(code, codeDb.hash_code);

		if (!isCodeValid) {
			codeDb.attemps += 1;
			await this.codesRepo.save(codeDb);
			throw new UnauthorizedError("Código incorrecto");
		}

		const queryRunner = AppDataSourceProd.createQueryRunner();
		await queryRunner.connect();
		await queryRunner.startTransaction();

		try {
			user.credential.password = await Bun.password.hash(newPassword);
			await queryRunner.manager.save(user.credential);

			codeDb.used = true;
			codeDb.ip_validation_address = currentIp;
			await queryRunner.manager.save(codeDb);

			sendEmail({
				to: email,
				subject: "Cambio de contraseña",
				html: passwordReseted(user.name, codeDb.createdAt.toISOString())
			});

			await queryRunner.commitTransaction();
			return "Contraseña actualizada con éxito";
		} catch (error) {
			await queryRunner.rollbackTransaction();
			throw error;
		} finally {
			await queryRunner.release();
		}
	}

	async findAll() {
		return this.userRepo.find();
	}
}
