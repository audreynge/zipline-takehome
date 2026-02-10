import { Pool } from 'pg';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initializes the database using schema.sql
 */
export const initDb = async (): Promise<void> => {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = await readFile(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  console.log('Database schema initialized');
};

export default pool;