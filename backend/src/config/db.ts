import { Pool, PoolConfig } from 'pg';
import { ENV } from './env.js';

const poolConfig: PoolConfig = ENV.DATABASE_URL
  ? {
      connectionString: ENV.DATABASE_URL,
      ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false
    }
  : {
      host: ENV.DB_HOST,
      port: ENV.DB_PORT,
      database: ENV.DB_NAME,
      user: ENV.DB_USER,
      password: ENV.DB_PASSWORD,
      ssl: ENV.DB_SSL ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

export const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('[PostgreSQL Error] Unexpected error on idle client:', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (ENV.NODE_ENV === 'development') {
    console.log('[SQL Query]', { text: text.trim().substring(0, 100), duration: `${duration}ms`, rows: res.rowCount });
  }
  return res;
};
