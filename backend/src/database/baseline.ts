import 'reflect-metadata'
import { AppDataSourceProd } from './dataBaseDev'

// Nombre/timestamp de la migración inicial. Si agregas más migraciones antes
// de aplicar el baseline, añádelas aquí (nombre y timestamp del archivo).
const BASELINE_MIGRATIONS = [{ name: 'Init1793665242620', timestamp: 1793665242620 }]

async function main() {
    await AppDataSourceProd.initialize()
    const qr = AppDataSourceProd.createQueryRunner()

    try {
        const hasSchema = await qr.hasTable('users')
        if (!hasSchema) {
            console.log('⚠️  La base no tiene tablas. Usa "bun run db:migrate" en lugar de baseline.')
            process.exitCode = 1
            return
        }

        await qr.query(`
            CREATE TABLE IF NOT EXISTS "migrations" (
                "id" SERIAL NOT NULL,
                "timestamp" bigint NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
            )
        `)

        for (const migration of BASELINE_MIGRATIONS) {
            const existing = await qr.query('SELECT "name" FROM "migrations" WHERE "name" = $1', [migration.name])
            if (existing.length > 0) {
                console.log(`✓ "${migration.name}" ya estaba registrada.`)
                continue
            }
            await qr.query('INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)', [
                migration.timestamp,
                migration.name,
            ])
            console.log(`✓ Baseline aplicado: "${migration.name}".`)
        }

        console.log('Listo. Esta BD ya no necesita ejecutar la migración inicial.')
    } finally {
        await qr.release()
        await AppDataSourceProd.destroy()
    }
}

main().catch((error) => {
    console.error('Error aplicando baseline:', error)
    process.exit(1)
})
