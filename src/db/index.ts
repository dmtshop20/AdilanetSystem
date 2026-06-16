import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  return mysql.createPool({
    host: process.env.SQL_HOST,
    port: parseInt(process.env.SQL_PORT || "3306"),
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  });
};

// Create a pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema, mode: 'default' });
