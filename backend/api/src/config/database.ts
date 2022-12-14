import { Pool } from 'pg'

const DEFAULT_POSTGRES_PORT = '5432'

const pool = new Pool({
  user: process.env.MMS_DATABASE_USER,
  host: process.env.MMS_DATABASE_HOST,
  database: process.env.MMS_DATABASE_NAME,
  password: process.env.MMS_DATABASE_PASSWORD,
  port: parseInt(process.env.MMS_DATABASE_PORT || DEFAULT_POSTGRES_PORT),
})

export default pool
