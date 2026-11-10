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

const router = new Hono()

router.get('/', (c) => { return c.json({ message: 'Servidor levantado correctamente' }) })
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

export default router