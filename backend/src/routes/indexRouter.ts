import { Hono } from 'hono'
import { accountRouter } from '../routes/accountRouter'
import authRouter from './authRouter'
import { categoryRouter } from './categoryRouter'
import { transactionRouter } from './transactionRouter'
import { creditCardRouter } from './creditCardRouter'
import { userRouter } from './userRouter'
import { authMiddleware } from '../middlewares/authMiddleware'
import { loanRouter } from './loansRouter'
import { dashboardRouter } from './dashboardRouter'
import { recurringPaymentRouter } from './recurringPaymentRouter'
import { notificationRouter } from './recurringNotificationRouter'
import { budgetRouter } from './budgetRouter'
import { contactRouter } from './contactRouter'
import { debtRouter } from './debtRouter'
import { reportsRouter } from './reportsRouter'
import { authRateLimit } from '../middlewares/security'
import { AppDataSourceProd } from '../database/dataBaseDev'

const router = new Hono()

router.get('/', (c) => { return c.json({ message: 'Servidor levantado correctamente' }) })

router.get('/health/live', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime() })
})

router.get('/health/ready', async (c) => {
  try {
    await AppDataSourceProd.query('SELECT 1')
    const rows = (await AppDataSourceProd.query(
      'SELECT COUNT(*)::int AS count FROM migrations'
    )) as { count: number }[]
    return c.json({
      status: 'ok',
      db: 'up',
      migrations: rows[0]?.count ?? 0,
    })
  } catch {
    return c.json({ status: 'error', db: 'down' }, 503)
  }
})

router.get('/health', async (c) => {
  try {
    await AppDataSourceProd.query('SELECT 1')
    return c.json({ status: 'ok' })
  } catch {
    return c.json({ status: 'error' }, 503)
  }
})
router.use('/auth/*', authRateLimit)
router.route('/auth', authRouter)
router.route('/user', userRouter)
router.use(authMiddleware);
router.route('/accounts', accountRouter)
router.route('/category', categoryRouter)
router.route('/transaction', transactionRouter)
router.route('/credit-card', creditCardRouter)
router.route('/loan', loanRouter)
router.route('/dashboard', dashboardRouter)
router.route('/recurring-payments', recurringPaymentRouter)
router.route('/notifications', notificationRouter)
router.route('/budgets', budgetRouter)
router.route('/contacts', contactRouter)
router.route('/debt', debtRouter)
router.route('/reports', reportsRouter)

export default router