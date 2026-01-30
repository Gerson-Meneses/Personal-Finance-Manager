import { Hono } from 'hono'
import { accountRouter } from '../routes/accountRouter'
import authRouter from './authRouter'
import { categoryRouter } from './categoryRouter'

const router = new Hono()

router.get('/', (c) => { return c.json({ message: 'Servidor levantado correctamente' }) })
router.route('/auth', authRouter)
router.route('/accounts', accountRouter)
router.route('/category', categoryRouter)

export default router