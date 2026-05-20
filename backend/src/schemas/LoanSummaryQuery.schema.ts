import { z } from 'zod';
import { StatusLoan, TypeLoan } from '../utils/Enums';

export const loanSummaryQuerySchema = z.object({
  // Filtros por tipo de préstamo
  type: z.enum(TypeLoan).nullish(),

  // Filtros por estado
  status: z.enum(StatusLoan).nullish(),

  // Excluir préstamos completados
  excludeCompleted: z.enum(['true', 'false']).transform(val => val === 'true').nullish(),

  // Excluir préstamos sin deuda (totalRemaining = 0)
  excludePaidOff: z.enum(['true', 'false']).transform(val => val === 'true').nullish(),

  // Filtro por acreedor
  lender: z.string().trim().min(1).max(100).nullish(),

  // Filtro de monto mínimo pendiente
  minRemaining: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? undefined : Number(val)),
    z.number().nonnegative().transform(n => Math.round(n * 100)).nullish()
  ),

  // Ordenamiento
  orderBy: z.enum(['totalRemaining', 'totalAmount', 'loanCount', 'lender']).default('totalRemaining'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),

  // Agrupar por lender (true) o incluir detalles (false)
  groupByLender: z.enum(['true', 'false']).transform(val => val === 'true').default(true),

}).strict();

export type LoanSummaryQuerySchema = z.infer<typeof loanSummaryQuerySchema>;