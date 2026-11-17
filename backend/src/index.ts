import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { bodyLimit } from 'hono/body-limit'
import router from './routes/indexRouter'
import { errorHandler } from './helpers/errorHandler'
import { AppDataSourceProd } from './database/dataBaseDev'
import { AppEnv } from './types'
import { RecurringPaymentService } from './services/recurringPaymentService'
import { LoanPlanService } from './services/loanPlanService'
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
// 6 MB permite adjuntos de hasta 5 MB con el overhead de multipart.
app.use(bodyLimit({ maxSize: 6 * 1024 * 1024 }))
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
    const loanPlanService = new LoanPlanService()
    let recurringRunning = false
    let loanPlansRunning = false

    const runRecurring = async () => {
      if (recurringRunning) return
      recurringRunning = true
      try {
        await recurringService.processAllDuePayments()
      } catch (error) {
        console.error('Error procesando pagos recurrentes:', error)
      } finally {
        recurringRunning = false
      }
    }

    const runLoanPlans = async () => {
      if (loanPlansRunning) return
      loanPlansRunning = true
      try {
        await loanPlanService.refreshAllOverdue()
      } catch (error) {
        console.error('Error actualizando cuotas vencidas:', error)
      } finally {
        loanPlansRunning = false
      }
    }

    void runRecurring()
    void runLoanPlans()
    const recurringInterval = setInterval(runRecurring, 10 * 60 * 1000)
    const loanPlansInterval = setInterval(runLoanPlans, 10 * 60 * 1000)

    const server = Bun.serve({
      fetch: app.fetch,
      port: Number(process.env.PORT) || 3000,
    })

    let shuttingDown = false
    const shutdown = async (signal: string) => {
      if (shuttingDown) return
      shuttingDown = true
      console.log(`🛑 Cerrando servidor (${signal})...`)
      clearInterval(recurringInterval)
      clearInterval(loanPlansInterval)
      try {
        await server.stop()
        await AppDataSourceProd.destroy()
      } catch (error) {
        console.error('Error durante el cierre:', error)
      } finally {
        process.exit(0)
      }
    }
    process.on('SIGTERM', () => void shutdown('SIGTERM'))
    process.on('SIGINT', () => void shutdown('SIGINT'))

    console.log('🚀 Server running')
  } catch (error) {
    console.error('❌ Error starting server:', error)
    process.exit(1)
  }
}

bootstrap()
