import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { bodyLimit } from 'hono/body-limit'
import router from './routes/indexRouter'
import { errorHandler } from './helpers/errorHandler'
import { AppDataSourceProd } from './database/dataBaseDev'
import { AppEnv } from './types'
import { RecurringPaymentService } from './services/recurringPaymentService'
import { securityHeaders } from './middlewares/security'
import 'dotenv/config'

const app = new Hono<AppEnv>()

const allowedOrigins = (
  process.env.CORS_ORIGINS ??
  process.env.FRONTEND_URL ??
  'http://localhost:5173,https://personal-finance-manager-lilac.vercel.app'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin) => {
      if (!origin) return allowedOrigins[0]
      return allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })
)
app.use(bodyLimit({ maxSize: 1024 * 1024 }))
app.use(securityHeaders)
app.use(logger())
app.onError(errorHandler)
app.route('/', router)

async function bootstrap() {
  try {
    await AppDataSourceProd.initialize()
    console.log('✅ Database connected')

    // Procesa vencimientos y débitos automáticos al arrancar y cada 10 minutos.
    const recurringService = new RecurringPaymentService()
    const runRecurring = () =>
      recurringService.processAllDuePayments().catch((error) => {
        console.error('Error procesando pagos recurrentes:', error)
      })

    void runRecurring()
    setInterval(runRecurring, 10 * 60 * 1000)

    Bun.serve({
      fetch: app.fetch,
      port: Number(process.env.PORT) || 3000,
    })

    console.log('🚀 Server running')
  } catch (error) {
    console.error('❌ Error starting server:', error)
    process.exit(1)
  }
}

bootstrap()
