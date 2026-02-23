import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import router from './routes/indexRouter'
import { errorHandler } from './helpers/errorHandler'
import { AppDataSource } from './database/dataSource';
import { AppDataSourceProd } from './database/dataBaseDev'
import { AppEnv } from './types'
import 'dotenv/config'

const app = new Hono<AppEnv>();

AppDataSourceProd.initialize()
    .then(() => {
        console.log("Data Source has been initialized!");
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });

app.onError(errorHandler)


app.use(cors())
app.use(logger())
app.route('/', router);


export default app
