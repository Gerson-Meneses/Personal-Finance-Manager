import { AppDataSourceProd } from "../database/dataBaseDev";
import { Loan } from "../entities/Loan.entity";
import { LoanPayment } from "../entities/LoanPayment.entity";
import { Transaction } from "../entities/Transaction.entity";
import { Account } from "../entities/Account.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { LoanSchema } from "../schemas/loan.schema";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { QuickPaymentSchema } from "../schemas/quickPayment.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import { StatusLoan, TypeAccount, TypeLoan, TypeTransaction } from "../utils/Enums";
import { money, round } from "../utils/normalizarMoney";
import { TransactionService } from "./transactionService";
import { UserService } from "./userService";
import { EntityManager, QueryRunner, Repository } from "typeorm";
import { Category } from "../entities/Category.entity";
import { User } from "../entities/User.entity";
import { TransactionSchema } from "../schemas/transaction.schema";
import { AccountResponse } from "../ResponseInterfaces/AccountResponse";
import { LoanPaymentResponse, LoanResponse, LoanSummary, LoanSummaryFlat, LoanSummaryGrouped, PaymentCalculation } from "../ResponseInterfaces/LoansResponse";
import { AccountService } from "./accountService";
import { calculateLoanPaymentStatus, toLoanPaymentResponse, toLoanResponse } from "../mappers/LoansMapper";
import { LoanQuerySchema } from "../schemas/Loanquery,schema";
import { LoanSummaryQuerySchema } from "../schemas/LoanSummaryQuery.schema";

interface PaymentError {
  loanId: string;
  error: string;
  statusCode: string;
}


export class LoansService {
  private loanRepo = AppDataSourceProd.getRepository(Loan);
  private accountService = new AccountService();
  private userService = new UserService();
  private transactionService = new TransactionService()

  async getLoans(
    userId: UuidSchema,
    filters: LoanQuerySchema
  ): Promise<PaginatedResult<LoanResponse>> {
    console.log(filters)
    try {
      // Validar y establecer valores por defecto
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
      const orderBy = filters.orderBy || "startDate";
      const order = filters.order || "DESC";

      // Crear query builder con los joins necesarios
      const qb = this.loanRepo
        .createQueryBuilder("loan")
        .leftJoinAndSelect("loan.payments", "payments")
        .leftJoinAndSelect("payments.transaction", "paymentTransaction")
        .leftJoinAndSelect("paymentTransaction.account", "paymentAccount")
        .leftJoinAndSelect("loan.transactionReference", "transaction")
        .leftJoinAndSelect("transaction.account", "account")
        .where("loan.userId = :userId", { userId });

      // ============ FILTROS BÁSICOS ============

      // Filtro por tipo de préstamo
      if (filters.type) {
        qb.andWhere("loan.type = :type", { type: filters.type });
      }

      // Filtro por estado
      if (filters.status) {
        qb.andWhere("loan.status = :status", { status: filters.status });
      }

      // Filtro por acreedor (búsqueda exacta)
      if (filters.lender) {
        qb.andWhere("LOWER(loan.lender) ILIKE LOWER(:lender)", {
          lender: `%${filters.lender}%`,
        });
      }

      // Búsqueda general (acreedor o ID)
      if (filters.search) {
        qb.andWhere(
          "(LOWER(loan.lender) ILIKE LOWER(:search) OR loan.id ILIKE :search)",
          { search: `%${filters.search}%` }
        );
      }

      // ============ FILTROS DE FECHA ============

      // Fecha exacta de inicio
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        qb.andWhere("DATE(loan.startDate) = DATE(:startDate)", { startDate });
      }

      // Rango de fechas de inicio (from/to)
      if (filters.from) {
        const fromDate = new Date(filters.from);
        qb.andWhere("DATE(loan.startDate) >= DATE(:fromDate)", {
          fromDate,
        });
      }

      if (filters.to) {
        const toDate = new Date(filters.to);
        qb.andWhere("DATE(loan.startDate) <= DATE(:toDate)", { toDate });
      }

      // ============ FILTROS DE MONTO PRINCIPAL ============

      if (filters.minAmount) {
        qb.andWhere("loan.principalAmount >= :minAmount", {
          minAmount: filters.minAmount,
        });
      }

      if (filters.maxAmount) {
        qb.andWhere("loan.principalAmount <= :maxAmount", {
          maxAmount: filters.maxAmount,
        });
      }

      // ============ FILTROS DE PAGOS ============

      // Filtro: tiene/no tiene pagos
      if (filters.hasPayments !== null && filters.hasPayments !== undefined) {
        if (filters.hasPayments) {
          qb.andWhere("payments.id IS NOT NULL");
        } else {
          qb.andWhere("payments.id IS NULL");
        }
      }

      // Rango de monto de pagos
      if (filters.minPaymentAmount) {
        qb.andWhere("payments.amount >= :minPaymentAmount", {
          minPaymentAmount: filters.minPaymentAmount,
        });
      }

      if (filters.maxPaymentAmount) {
        qb.andWhere("payments.amount <= :maxPaymentAmount", {
          maxPaymentAmount: filters.maxPaymentAmount,
        });
      }

      // Rango de fechas de pagos
      if (filters.paymentDateFrom) {
        const paymentFromDate = new Date(filters.paymentDateFrom);
        qb.andWhere("DATE(payments.date) >= DATE(:paymentFromDate)", {
          paymentFromDate,
        });
      }

      if (filters.paymentDateTo) {
        const paymentToDate = new Date(filters.paymentDateTo);
        qb.andWhere("DATE(payments.date) <= DATE(:paymentToDate)", {
          paymentToDate,
        });
      }

      // ============ ORDENAMIENTO Y PAGINACIÓN ============

      // Mapear el campo de ordenamiento a la columna correcta
      const orderByMap: Record<string, string> = {
        startDate: "loan.startDate",
        createdAt: "loan.createdAt",
        principalAmount: "loan.principalAmount",
      };

      const orderColumn = orderByMap[orderBy] || "loan.startDate";
      qb.orderBy(orderColumn, order as "ASC" | "DESC");

      // Aplicar paginación
      qb.skip((page - 1) * limit).take(limit);

      // ============ OBTENER RESULTADOS ============

      const [loans, total] = await qb.getManyAndCount();

      // Transformar a LoanResponse (asumiendo que tienes esta función)
      const items = await Promise.all(
        loans.map((loan) => toLoanResponse(loan, { moneyTransaction: false }))
      );

      return { items, total, page, limit };
    } catch (error) {
      throw new Error(
        "Error al obtener préstamos: " +
        (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  }

  async getLoanDetail(userId: UuidSchema, loanId: UuidSchema): Promise<LoanResponse> {
    try {
      const loan = await this.loanRepo.findOne({
        relations: [
          "payments",
          "payments.transaction",
          "payments.transaction.account",
          "transactionReference",
          "transactionReference.account",
          "transactionReference.category",
        ],
        where: { userId, id: loanId },
      });

      if (!loan) {
        throw new NotFoundError(`Préstamo con ID ${loanId} no encontrado para este usuario`);
      }

      return toLoanResponse(loan, { moneyTransaction: false })

    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new Error(
        "Error al obtener detalles del préstamo: " +
        (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  }

  async getLoansSummary(
    userId: string,
    filters?: LoanSummaryQuerySchema
  ): Promise<LoanSummaryGrouped[]> {
    try {
      // Obtener préstamos con relaciones
      const loans = await this.loanRepo.find({
        relations: ["payments"],
        where: { userId },
      });

      // Mapear para calcular detalles
      const loanDetails = loans.map(loan => ({
        loan,
        payment: calculateLoanPaymentStatus(loan),
      }));

      // ============ APLICAR FILTROS ============

      let filtered = loanDetails;

      // Filtro por tipo
      if (filters?.type) {
        filtered = filtered.filter(item => item.loan.type === filters.type);
      }

      // Filtro por estado
      if (filters?.status) {
        filtered = filtered.filter(item => item.loan.status === filters.status);
      }

      // Excluir completados
      if (filters?.excludeCompleted) {
        filtered = filtered.filter(item => item.loan.status !== StatusLoan.PAID);
      }

      // Excluir pagados (sin deuda)
      if (filters?.excludePaidOff) {
        filtered = filtered.filter(item => item.payment.totalRemaining > 0);
      }

      // Filtro por acreedor
      if (filters?.lender) {
        filtered = filtered.filter(item =>
          item.loan.lender.toLowerCase().includes(filters.lender!.toLowerCase())
        );
      }

      // Filtro de monto mínimo pendiente
      if (filters?.minRemaining && filters.minRemaining > 0) {
        filtered = filtered.filter(item => item.payment.totalRemaining >= filters.minRemaining!);
      }

      // ============ AGRUPAR POR LENDER Y TIPO ============

      const summaryMap = new Map<string, LoanSummaryGrouped>();

      filtered.forEach(({ loan, payment }) => {
        const lenderKey = loan.lender;

        if (!summaryMap.has(lenderKey)) {
          summaryMap.set(lenderKey, {
            lender: loan.lender,
            byType: {},
            total: {
              totalAmount: 0,
              totalPaid: 0,
              totalRemaining: 0,
              loanCount: 0,
            },
          });
        }

        const summary = summaryMap.get(lenderKey)!;

        // Inicializar tipo si no existe
        if (!summary.byType[loan.type]) {
          summary.byType[loan.type] = {
            totalAmount: 0,
            totalPaid: 0,
            totalRemaining: 0,
            loanCount: 0,
          };
        }

        // Actualizar detalles por tipo
        const typeDetail = summary.byType[loan.type]!;
        typeDetail.totalAmount += loan.principalAmount / 100;
        typeDetail.totalPaid += payment.totalPaid;
        typeDetail.totalRemaining = round(typeDetail.totalAmount - typeDetail.totalPaid);
        typeDetail.loanCount += 1;

        // Actualizar total
        summary.total.totalAmount += loan.principalAmount / 100;
        summary.total.totalPaid += payment.totalPaid;
        summary.total.totalRemaining = round(summary.total.totalAmount - summary.total.totalPaid);
        summary.total.loanCount += 1;
      });

      // ============ CALCULAR PROMEDIOS Y PROGRESO ============

      const result = Array.from(summaryMap.values()).map(item => ({
        ...item,
        byType: Object.entries(item.byType).reduce((acc, [type, detail]) => {
          if (detail) {
            acc[type as TypeLoan] = {
              ...detail,
              averageRemaining: round(detail.totalRemaining / detail.loanCount),
              progress: round((detail.totalPaid / detail.totalAmount) * 100),
            };
          }
          return acc;
        }, {} as any),
        total: {
          ...item.total,
          averageRemaining: round(item.total.totalRemaining / item.total.loanCount),
          progress: round((item.total.totalPaid / item.total.totalAmount) * 100),
        },
      }));

      // ============ ORDENAMIENTO ============

      const orderBy = filters?.orderBy || 'totalRemaining';
      const order = filters?.order || 'DESC';

      result.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (orderBy) {
          case 'totalRemaining':
            aValue = a.total.totalRemaining;
            bValue = b.total.totalRemaining;
            break;
          case 'totalAmount':
            aValue = a.total.totalAmount;
            bValue = b.total.totalAmount;
            break;
          case 'loanCount':
            aValue = a.total.loanCount;
            bValue = b.total.loanCount;
            break;
          case 'lender':
            return order === 'ASC'
              ? a.lender.localeCompare(b.lender)
              : b.lender.localeCompare(a.lender);
          default:
            aValue = a.total.totalRemaining;
            bValue = b.total.totalRemaining;
        }

        return order === 'ASC' ? aValue - bValue : bValue - aValue;
      });

      return result;
    } catch (error) {
      throw new Error(
        "Error al obtener resumen de préstamos: " +
        (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  }

  // ============ VERSIÓN PLANA (SIN AGRUPAR POR TIPO) ============
  async getLoansSummaryFlat(
    userId: string,
    filters?: LoanSummaryQuerySchema
  ): Promise<LoanSummaryFlat[]> {
    try {
      const loans = await this.loanRepo.find({
        relations: ["payments"],
        where: { userId },
      });

      const loanDetails = loans.map(loan => ({
        loan,
        payment: calculateLoanPaymentStatus(loan),
      }));

      // Aplicar filtros
      let filtered = loanDetails;

      if (filters?.type) {
        filtered = filtered.filter(item => item.loan.type === filters.type);
      }

      if (filters?.status) {
        filtered = filtered.filter(item => item.loan.status === filters.status);
      }

      if (filters?.excludeCompleted) {
        filtered = filtered.filter(item => item.loan.status !== StatusLoan.PAID);
      }

      if (filters?.excludePaidOff) {
        filtered = filtered.filter(item => item.payment.totalRemaining > 0);
      }

      if (filters?.lender) {
        filtered = filtered.filter(item =>
          item.loan.lender.toLowerCase().includes(filters.lender!.toLowerCase())
        );
      }

      if (filters?.minRemaining) {
        filtered = filtered.filter(item => item.payment.totalRemaining >= filters.minRemaining!);
      }

      // Agrupar por lender + tipo
      const summaryMap = new Map<string, LoanSummaryFlat>();

      filtered.forEach(({ loan, payment }) => {
        const key = `${loan.lender}_${loan.type}`;

        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            lender: loan.lender,
            type: loan.type,
            detail: {
              totalAmount: 0,
              totalPaid: 0,
              totalRemaining: 0,
              loanCount: 0,
            },
          });
        }

        const item = summaryMap.get(key)!;
        item.detail.totalAmount += loan.principalAmount / 100;
        item.detail.totalPaid += payment.totalPaid;
        item.detail.totalRemaining = round(item.detail.totalAmount - item.detail.totalPaid);
        item.detail.loanCount += 1;
      });

      // Calcular promedios y progreso
      const result = Array.from(summaryMap.values()).map(item => ({
        ...item,
        detail: {
          ...item.detail,
          averageRemaining: round(item.detail.totalRemaining / item.detail.loanCount),
          progress: round((item.detail.totalPaid / item.detail.totalAmount) * 100),
        },
      }));

      // Ordenar
      const orderBy = filters?.orderBy || 'totalRemaining';
      const order = filters?.order || 'DESC';

      result.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (orderBy) {
          case 'totalRemaining':
            aValue = a.detail.totalRemaining;
            bValue = b.detail.totalRemaining;
            break;
          case 'totalAmount':
            aValue = a.detail.totalAmount;
            bValue = b.detail.totalAmount;
            break;
          case 'loanCount':
            aValue = a.detail.loanCount;
            bValue = b.detail.loanCount;
            break;
          case 'lender':
            return order === 'ASC'
              ? a.lender.localeCompare(b.lender)
              : b.lender.localeCompare(a.lender);
          default:
            aValue = a.detail.totalRemaining;
            bValue = b.detail.totalRemaining;
        }

        return order === 'ASC' ? aValue - bValue : bValue - aValue;
      });

      return result;
    } catch (error) {
      throw new Error(
        "Error al obtener resumen de préstamos: " +
        (error instanceof Error ? error.message : "Error desconocido")
      );
    }
  }

  
  async createLoan(userId: UuidSchema, loanData: LoanSchema): Promise < LoanResponse > {
  const queryRunner = AppDataSourceProd.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const user = await this.userService.getUserById(userId);

    if(!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

      if(loanData.tea) {
  throw new ConflictError(
    "Préstamos con tasa de interés bancaria no están implementados aún",
    { tea: ["Esta funcionalidad será disponible próximamente"] }
  );
}

const transactionType =
  loanData.type === TypeLoan.GIVEN ? TypeTransaction.EXPENSE : TypeTransaction.INCOME;

const category = user.categories.find(
  (cat) => cat.name === "PRÉSTAMOS" && cat.type === transactionType
);

if (!category) {
  throw new NotFoundError(
    `Categoría de préstamos no encontrada. Asegúrese de que existe una categoría "PRÉSTAMOS" de tipo ${transactionType}`
  );
}

// Crear transacción
const transactionReferenceData = await this.transactionService.createTransaction(
  {
    name:
      loanData.type === TypeLoan.GIVEN
        ? `Préstamo a ${loanData.lender}`
        : `Préstamo de ${loanData.lender}`,
    type: transactionType,
    amount: loanData.amount,
    date: loanData.startDate,
    time: loanData.time,
    categoryId: category.id,
    description: loanData.description,
    accountId: loanData.accountId,
  },
  userId
);

const transactionReference = queryRunner.manager.create(Transaction, transactionReferenceData);

// Crear préstamo
const loan = queryRunner.manager.create(Loan, {
  user,
  ...loanData,
  principalAmount: loanData.amount,
  transactionReference,
});

const savedLoan = await queryRunner.manager.save(Loan, loan);

// Actualizar referencia de transacción
transactionReference.loan = savedLoan;

await queryRunner.manager.save(Transaction, transactionReference);

await queryRunner.commitTransaction();

return toLoanResponse(savedLoan, { moneyTransaction: false })

    } catch (error) {
  await queryRunner.rollbackTransaction();

  if (error instanceof NotFoundError || error instanceof ConflictError) {
    throw error;
  }

  throw new Error(
    "Error al crear préstamo: " + (error instanceof Error ? error.message : "Error desconocido")
  );
} finally {
  await queryRunner.release();
}
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async payLoan(
  userId: UuidSchema,
  loanId: UuidSchema,
  data: LoanPaymentSchema,
  entityManager ?: EntityManager): Promise < LoanPaymentResponse > {

    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if(!entityManager) {
        queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        manager = queryRunner.manager;
        isOwnTransaction = true;
      } else {
        manager = entityManager;
      }

      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ["categories"],
      });

      if(!user) {
        throw new NotFoundError("Usuario no encontrado");
      }

      const loan = await manager.findOne(Loan, {
        relations: ["payments"],
        where: { userId, id: loanId },
      });

      if(!loan) {
        throw new NotFoundError(
          `Préstamo con ID ${loanId} no encontrado para este usuario`
        );
      }

      if(loan.status === StatusLoan.PAID) {
  throw new ConflictError(
    `No se puede realizar un pago a un préstamo pagado`,
    {
      loan: ["Este préstamo ya fue pagado."],
    }
  );
}

const payment = calculateLoanPaymentStatus(loan);
const remainingInCents = loan.principalAmount - payment.totalPaidInCents;

if (remainingInCents <= 0) {
  throw new ConflictError("El préstamo ya está completamente pagado", {
    loan: ["No hay saldo pendiente para pagar"],
  });
}

if (data.amount > remainingInCents) {
  const remainingInDollars = remainingInCents / 100;
  throw new ConflictError(
    `El monto del pago excede la deuda restante. Monto máximo: ${round(remainingInDollars)}`,
    {
      amount: [
        `No puede pagar más de ${round(remainingInDollars)}. Deuda actual: ${round(remainingInDollars)}`,
      ],
    }
  );
}

const transactionType =
  loan.type === TypeLoan.GIVEN
    ? TypeTransaction.INCOME
    : TypeTransaction.EXPENSE;

const category = await manager.findOne(Category, {
  where: { name: "DEVOLUCIÓN DE PRÉSTAMO", type: transactionType, user: { id: userId } },
});

if (!category) {
  throw new NotFoundError(
    `Categoría de devolución no encontrada. Asegúrese de que existe una categoría "DEVOLUCIÓN DE PRÉSTAMO" de tipo ${transactionType}`
  );
}

const createTransaction: TransactionSchema = {
  ...data,
  name: `Pago ${loan.type == TypeLoan.GIVEN ? "de" : "a"} ${loan.lender}.`,
  type: transactionType,
  categoryId: category.id
}

const referenceTransaction = await this.transactionService.createTransaction(createTransaction, userId, manager)

const savedTransaction = manager.create(Transaction, referenceTransaction)

// Crear registro de pago del préstamo
const loanPayment = manager.create(LoanPayment, {
  amount: data.amount,
  date: data.date,
  time: data.time,
  description: data.description,
  loan,
  transaction: savedTransaction,
});

const savedPayment = await manager.save(loanPayment);

// Recalcular total pagado para este préstamo
const updatedTotalPaidInCents =
  (await manager.sum(LoanPayment, "amount", {
    loan: { id: loanId },
  })) || 0;

// Actualizar estado del préstamo si está completamente pagado
if (updatedTotalPaidInCents >= loan.principalAmount) {
  loan.status = StatusLoan.PAID;
  loan.payments.push(savedPayment)
  await manager.save(loan);
}

// Confirmar transacción si es propia
if (isOwnTransaction && queryRunner) {
  await queryRunner.commitTransaction();
}

return toLoanPaymentResponse(savedPayment, { transactionAmount: false });

    } catch (error) {
  // Revertir transacción si es propia
  if (isOwnTransaction && queryRunner) {
    await queryRunner.rollbackTransaction();
  }

  if (error instanceof NotFoundError || error instanceof ConflictError) {
    throw error;
  }

  if (error instanceof BadRequestError) {
    throw error;
  }
  const errorMessage =
    error instanceof Error ? error.message : "Error desconocido";
  throw new Error(`Error al registrar pago: ${errorMessage}`);
} finally {
  if (isOwnTransaction && queryRunner) {
    await queryRunner.release();
  }
}
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async quickPayMultipleLoans(
  userId: UuidSchema,
  data: QuickPaymentSchema,
): Promise < any > {

  const queryRunner = AppDataSourceProd.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  let isError = false;

  const { lender, type, amount } = data;

  try {
    const loans = await queryRunner.manager.find(Loan, {
      relations: ["payments"],
      where: {
        userId,
        lender,
        type,
        status: StatusLoan.PENDING,
      },
      order: {
        startDate: "ASC",
      },
    });

    if(loans.length === 0) {
  throw new NotFoundError(
    `No hay préstamos pendientes con ${lender} de tipo ${type}`
  );
}

let remainingAmount = amount;
const payments: LoanPaymentResponse[] = [];
const errors: PaymentError[] = [];

for (const loan of loans) {

  if (remainingAmount <= 0) break;

  try {
    const payment = calculateLoanPaymentStatus(loan);
    const loanRemainingInCents =
      loan.principalAmount - payment.totalPaidInCents;

    if (loanRemainingInCents <= 0) {
      continue;
    }

    const paymentAmount = Math.min(remainingAmount, loanRemainingInCents);

    const paymentData: LoanPaymentSchema = {
      ...data,
      amount: paymentAmount,
    };

    const result = await this.payLoan(
      userId,
      loan.id,
      paymentData,
      queryRunner.manager
    );

    payments.push(result);
    remainingAmount -= paymentAmount;

  } catch (error: any) {
    errors.push({
      loanId: loan.id,
      error:
        error instanceof Error ? error.message : "Error desconocido",
      statusCode: error.statusCode || "INTERNAL_ERROR",
    });
    continue;
  }
}

if (payments.length === 0) {
  isError = true
  const errorDetails = errors
    .map((e) => `${e.loanId}: ${e.error}`)
    .join("; ");
  throw new ConflictError(
    `No se pudo procesar ningún pago. Detalles: ${errorDetails}`,
    {
      payments: errors.map((e) => e.error),
    }
  );
}

if (errors.length > 0) {
  isError = true
  const errorDetails = errors.map((e) => `${e.loanId}: ${e.error}`).join("; ");
  console.warn(
    `Algunos pagos no se pudieron procesar. Detalles: ${errorDetails}`
  );
  throw new ConflictError(
    `Algunos pagos no se pudieron procesar. Detalles: ${errorDetails}`,
    {
      payments: errors.map((e) => e.error),
    }
  );
}

if (isError) await queryRunner.rollbackTransaction();

await queryRunner.commitTransaction();

return {
  success: true,
  totalPayments: payments.length,
  totalAmount: money(amount - remainingAmount),
  payments,
  notes: remainingAmount > 0 ? `Dinero Sobrante: S/ ${money(remainingAmount)}` : "Todos los fondos fueron utilizados",
  errors:
    errors.length > 0
      ? errors.map((e) => ({
        loanId: e.loanId,
        message: e.error,
      }))
      : [],
};
    } catch (error) {
  await queryRunner.rollbackTransaction();

  if (error instanceof NotFoundError || error instanceof ConflictError) {
    throw error;
  }

  if (error instanceof BadRequestError) {
    throw error;
  }

  const errorMessage =
    error instanceof Error ? error.message : "Error desconocido";
  throw new Error(
    `Error al realizar pagos múltiples: ${errorMessage}`
  );
} finally {
  await queryRunner.release();
}
  }

  async getLoanStatistics(userId: UuidSchema): Promise < {
  totalLoansGiven: number;
  totalLoansReceived: number;
  totalAmountGiven: number;
  totalAmountReceived: number;
  totalPaidGiven: number;
  totalPaidReceived: number;
  completedLoans: number;
  pendingLoans: number;
  averageLoanAmount: number;
} > {
  try {
    const loans = await this.loanRepo.find({
      relations: ["payments"],
      where: { userId },
    });

    let stats = {
      totalLoansGiven: 0,
      totalLoansReceived: 0,
      totalAmountGiven: 0,
      totalAmountReceived: 0,
      totalPaidGiven: 0,
      totalPaidReceived: 0,
      completedLoans: 0,
      pendingLoans: 0,
      averageLoanAmount: 0,
    };

    loans.forEach((loan) => {
      const payment = calculateLoanPaymentStatus(loan);
      const isGiven = loan.type === TypeLoan.GIVEN;

      if (isGiven) {
        stats.totalLoansGiven++;
        stats.totalAmountGiven += loan.principalAmount / 100;
        stats.totalPaidGiven += payment.totalPaid;
      } else {
        stats.totalLoansReceived++;
        stats.totalAmountReceived += loan.principalAmount / 100;
        stats.totalPaidReceived += payment.totalPaid;
      }

      if (loan.status === StatusLoan.PAID) {
        stats.completedLoans++;
      } else {
        stats.pendingLoans++;
      }
    });

    stats.totalAmountGiven = round(stats.totalAmountGiven);
    stats.totalAmountReceived = round(stats.totalAmountReceived);
    stats.totalPaidGiven = round(stats.totalPaidGiven);
    stats.totalPaidReceived = round(stats.totalPaidReceived);
    stats.averageLoanAmount = loans.length > 0 ? round((stats.totalAmountGiven + stats.totalAmountReceived) / loans.length) : 0;

    return stats;
  } catch(error) {
    throw new Error(
      "Error al obtener estadísticas: " + (error instanceof Error ? error.message : "Error desconocido")
    );
  }
}
}