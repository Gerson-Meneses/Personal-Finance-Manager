import { AppDataSourceProd } from "../database/dataBaseDev";
import { Loan } from "../entities/Loan.entity";
import { LoanMovement } from "../entities/LoanMovement.entity";
import { LoanPlan } from "../entities/LoanPlan.entity";
import { DebtInstallment } from "../entities/DebtInstallment.entity";
import { LoanPaymentAllocation } from "../entities/LoanPaymentAllocation.entity";
import { Contact } from "../entities/Contact.entity";
import { RecurringPayment } from "../entities/RecurringPayment.entity";
import dayjs from "dayjs";
import { Transaction } from "../entities/Transaction.entity";
import { Account } from "../entities/Account.entity";
import { BadRequestError, ConflictError, NotFoundError } from "../helpers/errors/domain.errors";
import { LoanSchema } from "../schemas/loan.schema";
import { LoanPaymentSchema } from "../schemas/loanPayment.schema";
import { PaginationQuerySchema } from "../schemas/queryPagination.schema";
import { QuickPaymentSchema } from "../schemas/quickPayment.schema";
import { UuidSchema } from "../schemas/uuid.schema";
import { PaginatedResult } from "../types";
import {
  DebtInstallmentStatus,
  LoanMovementType,
  LoanPlanStatus,
  StatusLoan,
  TransactionReportingImpact,
  TypeAccount,
  TypeLoan,
  TypeTransaction,
} from "../utils/Enums";
import { money, round } from "../utils/normalizarMoney";
import { TransactionService } from "./transactionService";
import { UserService } from "./userService";
import { EntityManager, In, IsNull, QueryRunner, Repository } from "typeorm";
import { Category } from "../entities/Category.entity";
import { User } from "../entities/User.entity";
import { TransactionSchema } from "../schemas/transaction.schema";
import { AccountResponse } from "../ResponseInterfaces/AccountResponse";
import { LoanPaymentResponse, LoanResponse, LoanSummaryGrouped, PaymentCalculation } from "../ResponseInterfaces/LoansResponse";
import { AccountService } from "./accountService";
import {
  calculateLoanPaymentStatus,
  toLoanMovementPaymentResponse,
  toLoanResponse,
} from "../mappers/LoansMapper";
import { ContactService, normalizeContactName } from "./contactService";
import { AuditService } from "./auditService";
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
  private contactService = new ContactService()
  private auditService = new AuditService()

  private async loadContactLoans(
    manager: EntityManager,
    userId: UuidSchema,
    contactId: UuidSchema,
    type: TypeLoan,
    preferredLoanId?: string
  ): Promise<Loan[]> {
    const loans = await manager
      .createQueryBuilder(Loan, "loan")
      .setLock("pessimistic_write")
      .where("loan.userId = :userId", { userId })
      .andWhere("loan.contactId = :contactId", { contactId })
      .andWhere("loan.type = :type", { type })
      .andWhere("loan.status != :cancelled", { cancelled: StatusLoan.CANCELLED })
      .orderBy("loan.startDate", "ASC")
      .getMany();

    if (loans.length === 0) return [];

    const movements = await manager.find(LoanMovement, {
      where: { loan: { id: In(loans.map((loan) => loan.id)) } },
      relations: ["transaction", "transaction.account", "transaction.category"],
    });
    const byLoan = new Map<string, LoanMovement[]>();
    for (const movement of movements) {
      const list = byLoan.get(movement.loanId) ?? [];
      list.push(movement);
      byLoan.set(movement.loanId, list);
    }
    for (const loan of loans) {
      loan.movements = byLoan.get(loan.id) ?? [];
    }

    return loans.sort((a, b) => {
      if (preferredLoanId) {
        if (a.id === preferredLoanId) return -1;
        if (b.id === preferredLoanId) return 1;
      }
      return a.startDate.toString().localeCompare(b.startDate.toString());
    });
  }

  private async refreshPlans(
    manager: EntityManager,
    planIds: string[]
  ): Promise<void> {
    const uniquePlanIds = [...new Set(planIds.filter(Boolean))];
    for (const planId of uniquePlanIds) {
      const plan = await manager.findOne(LoanPlan, { where: { id: planId } });
      if (!plan || plan.status === LoanPlanStatus.CANCELLED) continue;

      const pending = await manager
        .createQueryBuilder(DebtInstallment, "installment")
        .where("installment.planId = :planId", { planId })
        .andWhere("installment.status NOT IN (:...statuses)", {
          statuses: [DebtInstallmentStatus.PAID, DebtInstallmentStatus.CANCELLED],
        })
        .getCount();

      if (pending === 0) {
        plan.status = LoanPlanStatus.COMPLETED;
      } else if (plan.status === LoanPlanStatus.COMPLETED) {
        plan.status = LoanPlanStatus.ACTIVE;
      }
      await manager.save(plan);
    }
  }

  private async allocateRepayment(
    manager: EntityManager,
    movement: LoanMovement,
    loan: Loan,
    amount: number,
    preferredInstallmentId?: string
  ): Promise<void> {
    const statuses = [
      DebtInstallmentStatus.PENDING,
      DebtInstallmentStatus.PARTIAL,
      DebtInstallmentStatus.OVERDUE,
    ];
    const where = [{ loanId: loan.id, status: In(statuses) }] as any[];
    if (loan.contactId) {
      where.push({ loanId: IsNull(), contactId: loan.contactId, status: In(statuses) });
    }

    const installments = await manager.find(DebtInstallment, {
      where,
      order: { dueDate: "ASC", sequence: "ASC" },
    });

    if (preferredInstallmentId) {
      installments.sort((a, b) => {
        if (a.id === preferredInstallmentId) return -1;
        if (b.id === preferredInstallmentId) return 1;
        return 0;
      });
    }

    let pending = amount;
    const planIds: string[] = [];
    for (const installment of installments) {
      if (pending <= 0) break;
      const installmentPending = installment.amountDue - installment.paidAmount;
      if (installmentPending <= 0) continue;

      const applied = Math.min(pending, installmentPending);
      installment.paidAmount += applied;
      installment.status =
        installment.paidAmount >= installment.amountDue
          ? DebtInstallmentStatus.PAID
          : DebtInstallmentStatus.PARTIAL;
      await manager.save(installment);

      await manager.save(
        manager.create(LoanPaymentAllocation, {
          movementId: movement.id,
          installmentId: installment.id,
          amount: applied,
          principalAmount: applied,
        })
      );

      pending -= applied;
      if (installment.planId) planIds.push(installment.planId);
    }

    await this.refreshPlans(manager, planIds);
  }

  private refreshLoanStatus(loan: Loan): void {
    const status = calculateLoanPaymentStatus(loan);
    if (loan.status === StatusLoan.CANCELLED) return;
    if (status.totalRemainingInCents <= 0) {
      loan.status = StatusLoan.PAID;
    } else if (status.totalPaidInCents > 0) {
      loan.status = StatusLoan.PARTIALLY_PAID;
    } else {
      loan.status = StatusLoan.PENDING;
    }
  }

  private async recordRepayment(
    manager: EntityManager,
    userId: UuidSchema,
    loan: Loan,
    amount: number,
    data: LoanPaymentSchema,
    note?: string,
    preferredInstallmentId?: string
  ): Promise<LoanPaymentResponse> {
    const transactionType =
      loan.type === TypeLoan.GIVEN ? TypeTransaction.INCOME : TypeTransaction.EXPENSE;

    const category = await manager.findOne(Category, {
      where: {
        name: "DEVOLUCIÓN DE PRÉSTAMO",
        type: transactionType,
        user: { id: userId },
      },
    });
    if (!category) {
      throw new NotFoundError("Categoría de devolución de préstamo no encontrada");
    }

    const transactionResponse = await this.transactionService.createTransaction(
      {
        name: `Pago ${loan.type === TypeLoan.GIVEN ? "de" : "a"} ${loan.lender}.`,
        type: transactionType,
        amount,
        date: data.date,
        time: data.time,
        description: note ?? data.description,
        categoryId: category.id,
        accountId: data.accountId,
        reportingImpact: TransactionReportingImpact.CASHFLOW_ONLY,
      } as TransactionSchema,
      userId,
      false,
      manager
    );

    const transaction = await manager.findOneOrFail(Transaction, {
      where: { id: transactionResponse.id },
      relations: ["account", "category"],
    });

    const movement = await manager.save(
      manager.create(LoanMovement, {
        loanId: loan.id,
        type: LoanMovementType.REPAYMENT,
        amount,
        date: data.date,
        time: data.time ?? null,
        note: note ?? data.description ?? null,
        transactionId: transaction.id,
        transaction,
      })
    );

    loan.movements = [...(loan.movements ?? []), movement];
    await this.allocateRepayment(manager, movement, loan, amount, preferredInstallmentId);
    this.refreshLoanStatus(loan);
    await manager.save(loan);

    return toLoanMovementPaymentResponse(movement);
  }

  private async distributeContactPayment(
    manager: EntityManager,
    userId: UuidSchema,
    loans: Loan[],
    amount: number,
    data: LoanPaymentSchema,
    note?: string,
    preferredInstallmentId?: string
  ): Promise<{ payments: { loanId: string; payment: LoanPaymentResponse }[]; totalAppliedInCents: number }> {
    const debtInCents = loans.reduce(
      (sum, loan) => sum + calculateLoanPaymentStatus(loan).totalRemainingInCents,
      0
    );

    if (amount > debtInCents) {
      throw new ConflictError(
        `El pago excede la deuda pendiente con esta persona. Máximo permitido: ${round(debtInCents / 100)}`,
        { amount: [`Máximo permitido: ${round(debtInCents / 100)}`] }
      );
    }

    let pending = amount;
    const payments: { loanId: string; payment: LoanPaymentResponse }[] = [];

    for (const loan of loans) {
      if (pending <= 0) break;
      const remaining = calculateLoanPaymentStatus(loan).totalRemainingInCents;
      if (remaining <= 0) continue;

      const applied = Math.min(pending, remaining);
      const payment = await this.recordRepayment(
        manager,
        userId,
        loan,
        applied,
        data,
        note,
        preferredInstallmentId
      );
      payments.push({ loanId: loan.id, payment });
      pending -= applied;
    }

    return { payments, totalAppliedInCents: amount - pending };
  }

  async getLoans(
    userId: UuidSchema,
    filters: LoanQuerySchema
  ): Promise<PaginatedResult<LoanResponse>> {
    try {
      // Validar y establecer valores por defecto
      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
      const orderBy = filters.orderBy || "startDate";
      const order = filters.order || "DESC";

      // Crear query builder con los joins necesarios
      const qb = this.loanRepo
        .createQueryBuilder("loan")
        .leftJoinAndSelect("loan.contact", "contact")
        .leftJoinAndSelect("loan.movements", "movement")
        .leftJoinAndSelect("movement.transaction", "movementTransaction")
        .leftJoinAndSelect("movementTransaction.account", "movementAccount")
        .leftJoinAndSelect("movementTransaction.category", "movementCategory")
        .leftJoinAndSelect("loan.transactionReference", "transaction")
        .leftJoinAndSelect("transaction.account", "account")
        .leftJoinAndSelect("transaction.category", "category")
        .where("loan.userId = :userId", { userId });

      // ============ FILTROS BÁSICOS ============

      // Filtro por tipo de préstamo
      if (filters.type) {
        qb.andWhere("loan.type = :type", { type: filters.type });
      }

      // Filtro por estado
      if (filters.status) {
        if (filters.status === StatusLoan.PENDING) {
          qb.andWhere("loan.status IN (:...statuses)", {
            statuses: [StatusLoan.PENDING, StatusLoan.PARTIALLY_PAID, StatusLoan.OVERDUE],
          });
        } else {
          qb.andWhere("loan.status = :status", { status: filters.status });
        }
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

      // ============ FILTROS DE PAGOS (LEDGER) ============

      if (filters.hasPayments !== null && filters.hasPayments !== undefined) {
        const exists = `EXISTS (SELECT 1 FROM loan_movements m WHERE m."loanId" = loan.id AND m.type = 'REPAYMENT')`;
        qb.andWhere(filters.hasPayments ? exists : `NOT ${exists}`);
      }

      if (filters.minPaymentAmount) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM loan_movements m WHERE m."loanId" = loan.id AND m.type = 'REPAYMENT' AND m.amount >= :minPaymentAmount)`,
          { minPaymentAmount: filters.minPaymentAmount }
        );
      }

      if (filters.maxPaymentAmount) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM loan_movements m WHERE m."loanId" = loan.id AND m.type = 'REPAYMENT' AND m.amount <= :maxPaymentAmount)`,
          { maxPaymentAmount: filters.maxPaymentAmount }
        );
      }

      if (filters.paymentDateFrom) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM loan_movements m WHERE m."loanId" = loan.id AND m.type = 'REPAYMENT' AND m.date >= :paymentFromDate)`,
          { paymentFromDate: filters.paymentDateFrom }
        );
      }

      if (filters.paymentDateTo) {
        qb.andWhere(
          `EXISTS (SELECT 1 FROM loan_movements m WHERE m."loanId" = loan.id AND m.type = 'REPAYMENT' AND m.date <= :paymentToDate)`,
          { paymentToDate: filters.paymentDateTo }
        );
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
        loans.map((loan) => toLoanResponse(loan, { moneyTransaction: true }))
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
          "contact",
          "movements",
          "movements.transaction",
          "movements.transaction.account",
          "movements.transaction.category",
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
        relations: ["movements", "contact"],
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
        filtered = filters.status === StatusLoan.PENDING
          ? filtered.filter(item =>
              [StatusLoan.PENDING, StatusLoan.PARTIALLY_PAID, StatusLoan.OVERDUE].includes(item.loan.status)
            )
          : filtered.filter(item => item.loan.status === filters.status);
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
        const lenderKey = loan.contactId ?? loan.lender;

        if (!summaryMap.has(lenderKey)) {
          summaryMap.set(lenderKey, {
            lender: loan.lender,
            contactId: loan.contactId ?? undefined,
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
        typeDetail.totalAmount += payment.totalDebt;
        typeDetail.totalPaid += payment.totalPaid;
        typeDetail.totalRemaining = round(typeDetail.totalAmount - typeDetail.totalPaid);
        typeDetail.loanCount += 1;

        // Actualizar total
        summary.total.totalAmount += payment.totalDebt;
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
              totalAmount: round(detail.totalAmount),
              totalPaid: round(detail.totalPaid),
              totalRemaining: round(detail.totalRemaining),
              averageRemaining: round(detail.totalRemaining / detail.loanCount),
              progress: round((detail.totalPaid / detail.totalAmount) * 100),
            };
          }
          return acc;
        }, {} as any),
        total: {
          ...item.total,
          totalAmount: round(item.total.totalAmount),
          totalPaid: round(item.total.totalPaid),
          totalRemaining: round(item.total.totalRemaining),
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

  async createLoan(
    userId: UuidSchema,
    loanData: LoanSchema,
    entityManager?: EntityManager
  ): Promise<LoanResponse> {
    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if (!entityManager) {
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
      if (!user) throw new NotFoundError("Usuario no encontrado");

      if (loanData.tea) {
        throw new ConflictError(
          "Préstamos con tasa de interés bancaria no están implementados aún",
          { tea: ["Esta funcionalidad será disponible próximamente"] }
        );
      }

      const contact = loanData.contactId
        ? await manager.findOne(Contact, { where: { id: loanData.contactId, userId } })
        : await this.contactService.findOrCreate(userId, loanData.lender, manager);

      if (!contact) throw new NotFoundError("Contacto no encontrado");

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

      const transactionResponse = await this.transactionService.createTransaction(
        {
          name:
            loanData.type === TypeLoan.GIVEN
              ? `Préstamo a ${contact.name}`
              : `Préstamo de ${contact.name}`,
          type: transactionType,
          amount: loanData.amount,
          date: loanData.startDate,
          time: loanData.time,
          categoryId: category.id,
          description: loanData.description,
          accountId: loanData.accountId,
          reportingImpact: TransactionReportingImpact.CASHFLOW_ONLY,
        } as TransactionSchema,
        userId,
        false,
        manager
      );

      const transactionReference = await manager.findOneOrFail(Transaction, {
        where: { id: transactionResponse.id },
        relations: ["account", "category"],
      });

      const loan = manager.create(Loan, {
        user,
        contact,
        contactId: contact.id,
        type: loanData.type,
        lender: contact.name,
        principalAmount: loanData.amount,
        startDate: loanData.startDate,
        notes: loanData.notes ?? null,
        transactionReference,
      });

      const savedLoan = await manager.save(Loan, loan);

      transactionReference.loan = savedLoan;
      await manager.save(Transaction, transactionReference);

      const movement = await manager.save(
        manager.create(LoanMovement, {
          loanId: savedLoan.id,
          type: LoanMovementType.ADVANCE,
          amount: loanData.amount,
          date: loanData.startDate,
          time: loanData.time ?? null,
          note: loanData.description ?? null,
          transactionId: transactionReference.id,
          transaction: transactionReference,
        })
      );

      savedLoan.movements = [movement];
      savedLoan.contact = contact;

      await this.auditService.log(
        userId,
        "LOAN",
        savedLoan.id,
        "CREATE",
        {
          after: {
            contactId: contact.id,
            type: savedLoan.type,
            principalAmount: savedLoan.principalAmount,
            status: savedLoan.status,
          },
          reason: loanData.description,
        },
        manager
      );

      if (isOwnTransaction && queryRunner) {
        await queryRunner.commitTransaction();
      }

      return toLoanResponse(savedLoan, { moneyTransaction: false });
    } catch (error) {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      throw new Error(
        "Error al crear préstamo: " + (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async forgiveLoan(
    userId: UuidSchema,
    loanId: UuidSchema,
    data: { amount?: number; date?: string; reason?: string }
  ): Promise<LoanResponse> {
    const queryRunner = AppDataSourceProd.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["movements", "contact"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");
      if (loan.status === StatusLoan.CANCELLED) {
        throw new ConflictError("No se puede condonar un préstamo cancelado");
      }

      const status = calculateLoanPaymentStatus(loan);
      const remaining = status.totalRemainingInCents;
      if (remaining <= 0) throw new ConflictError("El préstamo no tiene saldo pendiente");

      const amount = data.amount ?? remaining;
      if (amount <= 0) throw new ConflictError("El monto a condonar debe ser mayor a 0");
      if (amount > remaining) {
        throw new ConflictError(
          `El monto excede el saldo pendiente. Máximo condonable: ${round(remaining / 100)}`
        );
      }

      const movement = await manager.save(
        manager.create(LoanMovement, {
          loanId: loan.id,
          type: LoanMovementType.FORGIVENESS,
          amount,
          date: data.date ?? dayjs().format("YYYY-MM-DD"),
          note: data.reason ?? "Saldo condonado",
        })
      );

      loan.movements = [...(loan.movements ?? []), movement];
      this.refreshLoanStatus(loan);
      await manager.save(loan);

      await this.auditService.log(
        userId,
        "LOAN",
        loan.id,
        "FORGIVENESS",
        { after: { amount, movementId: movement.id }, reason: data.reason },
        manager
      );

      await queryRunner.commitTransaction();
      return toLoanResponse(loan, { moneyTransaction: false });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateMovement(
    userId: UuidSchema,
    loanId: UuidSchema,
    movementId: UuidSchema,
    data: { date?: string; note?: string | null; reason?: string }
  ): Promise<LoanPaymentResponse> {
    const queryRunner = AppDataSourceProd.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const loan = await manager.findOne(Loan, { where: { id: loanId, userId } });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");

      const movement = await manager.findOne(LoanMovement, {
        where: { id: movementId, loanId },
        relations: ["transaction"],
      });
      if (!movement) throw new NotFoundError("Movimiento no encontrado");

      const before = { date: movement.date, note: movement.note };
      if (data.date) movement.date = data.date;
      if (data.note !== undefined) movement.note = data.note;
      await manager.save(movement);

      if (movement.transaction) {
        if (data.date) movement.transaction.date = data.date;
        if (data.note !== undefined) movement.transaction.description = data.note ?? undefined;
        await manager.save(movement.transaction);
      }

      await this.auditService.log(
        userId,
        "LOAN_MOVEMENT",
        movement.id,
        "UPDATE",
        {
          before,
          after: { date: movement.date, note: movement.note },
          reason: data.reason,
        },
        manager
      );

      await queryRunner.commitTransaction();
      return toLoanMovementPaymentResponse(movement);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reverseMovement(
    userId: UuidSchema,
    loanId: UuidSchema,
    movementId: UuidSchema,
    data: { date?: string; reason?: string }
  ): Promise<LoanPaymentResponse> {
    const queryRunner = AppDataSourceProd.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["movements"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");

      const movement = await manager.findOne(LoanMovement, {
        where: { id: movementId, loanId },
        relations: ["transaction", "transaction.account", "transaction.category"],
      });
      if (!movement) throw new NotFoundError("Movimiento no encontrado");
      if (movement.type !== LoanMovementType.REPAYMENT) {
        throw new ConflictError("Solo se pueden reversar pagos de préstamo");
      }
      if (!movement.transaction || !movement.transaction.account) {
        throw new ConflictError("El pago no tiene una transacción asociada para reversar");
      }

      const existing = await manager.findOne(LoanMovement, {
        where: { reversalOfMovementId: movement.id },
      });
      if (existing) throw new ConflictError("Este pago ya fue reversado");

      const reversalType =
        movement.transaction.type === TypeTransaction.INCOME
          ? TypeTransaction.EXPENSE
          : TypeTransaction.INCOME;

      const category = await manager.findOne(Category, {
        where: {
          name: "DEVOLUCIÓN DE PRÉSTAMO",
          type: reversalType,
          user: { id: userId },
        },
      });
      if (!category) throw new NotFoundError("Categoría de devolución no encontrada");

      const date = data.date ?? dayjs().format("YYYY-MM-DD");
      const transactionResponse = await this.transactionService.createTransaction(
        {
          name: `Reversión de pago ${loan.type === TypeLoan.GIVEN ? "de" : "a"} ${loan.lender}`,
          type: reversalType,
          amount: movement.amount,
          date,
          description: data.reason ?? "Pago reversado",
          categoryId: category.id,
          accountId: movement.transaction.account.id,
          reportingImpact: TransactionReportingImpact.CASHFLOW_ONLY,
        } as TransactionSchema,
        userId,
        false,
        manager
      );

      const transaction = await manager.findOneOrFail(Transaction, {
        where: { id: transactionResponse.id },
        relations: ["account", "category"],
      });

      const reversal = await manager.save(
        manager.create(LoanMovement, {
          loanId,
          type: LoanMovementType.ADJUSTMENT,
          amount: movement.amount,
          date,
          note: data.reason ?? `Reversión del pago ${movement.id}`,
          transactionId: transaction.id,
          transaction,
          reversalOfMovementId: movement.id,
        })
      );

      const allocations = await manager.find(LoanPaymentAllocation, {
        where: { movementId: movement.id },
        relations: ["installment"],
      });
      const planIds: string[] = [];
      for (const allocation of allocations) {
        const installment = allocation.installment;
        if (!installment) continue;
        installment.paidAmount = Math.max(0, installment.paidAmount - allocation.amount);
        if (installment.paidAmount >= installment.amountDue) {
          installment.status = DebtInstallmentStatus.PAID;
        } else if (installment.paidAmount > 0) {
          installment.status = DebtInstallmentStatus.PARTIAL;
        } else if (installment.dueDate && installment.dueDate < dayjs().format("YYYY-MM-DD")) {
          installment.status = DebtInstallmentStatus.OVERDUE;
        } else {
          installment.status = DebtInstallmentStatus.PENDING;
        }
        if (installment.planId) planIds.push(installment.planId);
        await manager.save(installment);
      }

      loan.movements = [...(loan.movements ?? []), reversal];
      this.refreshLoanStatus(loan);
      await manager.save(loan);
      await this.refreshPlans(manager, planIds);

      await this.auditService.log(
        userId,
        "LOAN_MOVEMENT",
        movement.id,
        "REVERSE",
        { after: { reversalId: reversal.id, amount: movement.amount }, reason: data.reason },
        manager
      );

      await queryRunner.commitTransaction();
      return toLoanMovementPaymentResponse(reversal);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateLoan(
    userId: UuidSchema,
    loanId: UuidSchema,
    data: {
      contactId?: string;
      notes?: string | null;
      startDate?: string;
      principalAmount?: number;
      reason?: string;
    }
  ): Promise<LoanResponse> {
    const queryRunner = AppDataSourceProd.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["contact", "movements", "movements.transaction", "transactionReference"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");
      if (loan.status === StatusLoan.CANCELLED) {
        throw new ConflictError("No se puede editar un préstamo cancelado");
      }

      const before = {
        contactId: loan.contactId,
        lender: loan.lender,
        notes: loan.notes,
        startDate: loan.startDate,
        principalAmount: loan.principalAmount,
      };

      if (data.contactId) {
        const contact = await manager.findOne(Contact, {
          where: { id: data.contactId, userId },
        });
        if (!contact) throw new NotFoundError("Contacto no encontrado");
        loan.contact = contact;
        loan.contactId = contact.id;
        loan.lender = contact.name;
      }

      if (data.notes !== undefined) loan.notes = data.notes;
      if (data.startDate) {
        loan.startDate = data.startDate;
        const initialAdvance = (loan.movements ?? []).find(
          (movement) => movement.type === LoanMovementType.ADVANCE
        );
        if (initialAdvance) {
          initialAdvance.date = data.startDate;
          await manager.save(initialAdvance);
          if (initialAdvance.transactionId) {
            await manager.update(Transaction, { id: initialAdvance.transactionId }, { date: data.startDate });
          }
        }
      }

      if (data.principalAmount !== undefined && data.principalAmount !== loan.principalAmount) {
        const delta = data.principalAmount - loan.principalAmount;
        const movement = await manager.save(
          manager.create(LoanMovement, {
            loanId: loan.id,
            type: LoanMovementType.ADJUSTMENT,
            amount: delta,
            date: dayjs().format("YYYY-MM-DD"),
            note: data.reason ?? "Ajuste de monto del préstamo",
          })
        );
        loan.movements = [...(loan.movements ?? []), movement];
        loan.principalAmount = data.principalAmount;
        this.refreshLoanStatus(loan);
      }

      await manager.save(loan);

      await this.auditService.log(
        userId,
        "LOAN",
        loan.id,
        "UPDATE",
        {
          before,
          after: {
            contactId: loan.contactId,
            lender: loan.lender,
            notes: loan.notes,
            startDate: loan.startDate,
            principalAmount: loan.principalAmount,
          },
          reason: data.reason,
        },
        manager
      );

      await queryRunner.commitTransaction();
      return toLoanResponse(loan, { moneyTransaction: false });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelLoan(userId: UuidSchema, loanId: UuidSchema, reason?: string): Promise<LoanResponse> {
    const queryRunner = AppDataSourceProd.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const manager = queryRunner.manager;
      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["movements", "contact"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");
      if (loan.status === StatusLoan.CANCELLED) return toLoanResponse(loan, { moneyTransaction: false });

      const before = { status: loan.status, cancelledAt: loan.cancelledAt };
      loan.status = StatusLoan.CANCELLED;
      loan.cancelledAt = new Date();
      loan.cancelReason = reason ?? "Cancelado por el usuario";
      await manager.save(loan);

      const today = dayjs().format("YYYY-MM-DD");
      await manager
        .createQueryBuilder()
        .update(DebtInstallment)
        .set({ status: DebtInstallmentStatus.CANCELLED })
        .where("loanId = :loanId", { loanId })
        .andWhere("dueDate >= :today", { today })
        .andWhere("status != :paid", { paid: DebtInstallmentStatus.PAID })
        .execute();

      await manager
        .createQueryBuilder()
        .update(LoanPlan)
        .set({ status: LoanPlanStatus.CANCELLED })
        .where("loanId = :loanId", { loanId })
        .andWhere("status IN (:...statuses)", {
          statuses: [LoanPlanStatus.ACTIVE, LoanPlanStatus.PAUSED],
        })
        .execute();

      await manager
        .createQueryBuilder()
        .update(RecurringPayment)
        .set({ isActive: false })
        .where("loanId = :loanId", { loanId })
        .execute();

      await this.auditService.log(
        userId,
        "LOAN",
        loan.id,
        "CANCEL",
        { before, after: { status: loan.status }, reason },
        manager
      );

      await queryRunner.commitTransaction();
      return toLoanResponse(loan, { moneyTransaction: false });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getLoanAudit(userId: UuidSchema, loanId: UuidSchema) {
    const loan = await this.loanRepo.findOne({ where: { id: loanId, userId } });
    if (!loan) throw new NotFoundError("Préstamo no encontrado");
    return this.auditService.list(userId, "LOAN", loanId);
  }

  async addAdvanceToLoan(
    userId: UuidSchema,
    loanId: UuidSchema,
    data: {
      amount: number;
      date: string;
      time?: string;
      accountId: string;
      description?: string;
    },
    entityManager?: EntityManager
  ): Promise<{ movementId: string; transactionId: string; amount: number }> {
    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if (!entityManager) {
        queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        manager = queryRunner.manager;
        isOwnTransaction = true;
      } else {
        manager = entityManager;
      }

      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["movements", "contact"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");
      if (loan.status === StatusLoan.CANCELLED) {
        throw new ConflictError("No se puede aumentar un préstamo cancelado");
      }

      const user = await manager.findOne(User, {
        where: { id: userId },
        relations: ["categories"],
      });
      if (!user) throw new NotFoundError("Usuario no encontrado");

      const transactionType =
        loan.type === TypeLoan.GIVEN ? TypeTransaction.EXPENSE : TypeTransaction.INCOME;
      const category = user.categories.find(
        (cat) => cat.name === "PRÉSTAMOS" && cat.type === transactionType
      );
      if (!category) throw new NotFoundError("Categoría de préstamos no encontrada");

      const transactionResponse = await this.transactionService.createTransaction(
        {
          name: `Préstamo ${loan.type === TypeLoan.GIVEN ? "a" : "de"} ${loan.lender}`,
          type: transactionType,
          amount: data.amount,
          date: data.date,
          time: data.time,
          description: data.description,
          categoryId: category.id,
          accountId: data.accountId,
          reportingImpact: TransactionReportingImpact.CASHFLOW_ONLY,
        } as TransactionSchema,
        userId,
        false,
        manager
      );

      const transaction = await manager.findOneOrFail(Transaction, {
        where: { id: transactionResponse.id },
        relations: ["account", "category"],
      });

      const movement = await manager.save(
        manager.create(LoanMovement, {
          loanId: loan.id,
          type: LoanMovementType.ADVANCE,
          amount: data.amount,
          date: data.date,
          time: data.time ?? null,
          note: data.description ?? null,
          transactionId: transaction.id,
          transaction,
        })
      );

      loan.movements = [...(loan.movements ?? []), movement];
      this.refreshLoanStatus(loan);
      await manager.save(loan);

      await this.auditService.log(
        userId,
        "LOAN",
        loan.id,
        "ADVANCE",
        {
          after: { amount: data.amount, movementId: movement.id },
          reason: data.description,
        },
        manager
      );

      if (isOwnTransaction && queryRunner) {
        await queryRunner.commitTransaction();
      }

      return {
        movementId: movement.id,
        transactionId: transaction.id,
        amount: data.amount,
      };
    } catch (error) {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }

      throw new Error(
        "Error al aumentar la deuda: " + (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async payLoan(
    userId: UuidSchema,
    loanId: UuidSchema,
    data: LoanPaymentSchema,
    entityManager?: EntityManager
  ): Promise<LoanPaymentResponse> {
    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if (!entityManager) {
        queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        manager = queryRunner.manager;
        isOwnTransaction = true;
      } else {
        manager = entityManager;
      }

      const loan = await manager.findOne(Loan, {
        where: { id: loanId, userId },
        relations: ["contact"],
      });
      if (!loan) throw new NotFoundError("Préstamo no encontrado");
      if (loan.status === StatusLoan.CANCELLED) {
        throw new ConflictError("No se puede pagar un préstamo cancelado");
      }

      let contactId = loan.contactId;
      if (!contactId) {
        const contact = await this.contactService.findOrCreate(userId, loan.lender, manager);
        contactId = contact.id;
        loan.contactId = contact.id;
        await manager.save(loan);
      }

      const loans = await this.loadContactLoans(
        manager,
        userId,
        contactId as UuidSchema,
        loan.type,
        loanId
      );

      const result = await this.distributeContactPayment(
        manager,
        userId,
        loans,
        data.amount,
        data,
        data.description
      );

      if (isOwnTransaction && queryRunner) {
        await queryRunner.commitTransaction();
      }

      const selected =
        result.payments.find((item) => item.loanId === loanId)?.payment ??
        result.payments[0]?.payment;
      if (!selected) throw new ConflictError("No se pudo aplicar el pago");
      return selected;
    } catch (error) {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }

      throw new Error(
        "Error al registrar pago: " + (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async payInstallment(
    userId: UuidSchema,
    installmentId: UuidSchema,
    data: {
      amount?: number;
      date: string;
      time?: string;
      accountId: string;
      description?: string;
    },
    entityManager?: EntityManager
  ): Promise<LoanPaymentResponse> {
    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if (!entityManager) {
        queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        manager = queryRunner.manager;
        isOwnTransaction = true;
      } else {
        manager = entityManager;
      }

      const installment = await manager.findOne(DebtInstallment, {
        where: { id: installmentId },
        relations: ["loan", "loan.contact", "contact", "plan"],
      });
      if (!installment) throw new NotFoundError("Cuota no encontrada");
      if (installment.status === DebtInstallmentStatus.CANCELLED) {
        throw new ConflictError("Esta cuota está cancelada");
      }
      if (installment.status === DebtInstallmentStatus.PAID) {
        throw new ConflictError("Esta cuota ya fue pagada");
      }

      const direction = installment.loan?.type ?? installment.plan?.direction;
      const contactId = installment.contactId ?? installment.loan?.contactId;
      if (!direction || !contactId) {
        throw new ConflictError("La cuota no tiene contacto o dirección");
      }

      const preferredLoanId = installment.loanId ?? undefined;
      const loans = await this.loadContactLoans(
        manager,
        userId,
        contactId as UuidSchema,
        direction,
        preferredLoanId
      );
      if (loans.length === 0) throw new ConflictError("No hay préstamos pendientes para esta cuota");

      const pendingInstallment = Math.max(0, installment.amountDue - installment.paidAmount);
      const amount = data.amount ?? pendingInstallment;
      if (amount <= 0) throw new ConflictError("La cuota no tiene saldo pendiente");

      const result = await this.distributeContactPayment(
        manager,
        userId,
        loans,
        amount,
        {
          amount,
          date: data.date,
          time: data.time,
          accountId: data.accountId,
          description: data.description,
        },
        data.description,
        installmentId
      );

      if (isOwnTransaction && queryRunner) {
        await queryRunner.commitTransaction();
      }

      const selected =
        (preferredLoanId
          ? result.payments.find((item) => item.loanId === preferredLoanId)?.payment
          : undefined) ?? result.payments[0]?.payment;
      if (!selected) throw new ConflictError("No se pudo aplicar el pago");
      return selected;
    } catch (error) {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }

      throw new Error(
        "Error al pagar la cuota: " + (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async payLenderDebt(
    userId: UuidSchema,
    data: QuickPaymentSchema,
    entityManager?: EntityManager
  ): Promise<{
    success: boolean;
    totalPayments: number;
    totalAmount: number;
    payments: LoanPaymentResponse[];
    remainingAmount: number;
  }> {
    let queryRunner: QueryRunner | undefined;
    let manager: EntityManager;
    let isOwnTransaction = false;

    try {
      if (!entityManager) {
        queryRunner = AppDataSourceProd.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        manager = queryRunner.manager;
        isOwnTransaction = true;
      } else {
        manager = entityManager;
      }

      const contact = await manager.findOne(Contact, {
        where: { userId, normalizedName: normalizeContactName(data.lender) },
      });
      if (!contact) {
        throw new NotFoundError(`No se encontró un contacto llamado ${data.lender}`);
      }

      const loans = await this.loadContactLoans(manager, userId, contact.id, data.type);
      if (loans.length === 0) {
        throw new NotFoundError("No hay préstamos pendientes con esa persona");
      }

      const result = await this.distributeContactPayment(
        manager,
        userId,
        loans,
        data.amount,
        data,
        data.description
      );

      if (isOwnTransaction && queryRunner) {
        await queryRunner.commitTransaction();
      }

      return {
        success: true,
        totalPayments: result.payments.length,
        totalAmount: money(result.totalAppliedInCents),
        payments: result.payments.map((item) => item.payment),
        remainingAmount: money(data.amount - result.totalAppliedInCents),
      };
    } catch (error) {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.rollbackTransaction();
      }

      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof BadRequestError) {
        throw error;
      }

      throw new Error(
        "Error al distribuir el pago entre préstamos: " +
          (error instanceof Error ? error.message : "Error desconocido")
      );
    } finally {
      if (isOwnTransaction && queryRunner) {
        await queryRunner.release();
      }
    }
  }

  async quickPayMultipleLoans(
    userId: UuidSchema,
    data: QuickPaymentSchema,
  ): Promise<{
    success: boolean;
    totalPayments: number;
    totalAmount: number;
    payments: LoanPaymentResponse[];
    remainingAmount: number;
  }> {
    return this.payLenderDebt(userId, data);
  }


}