// utils/db.js
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Use Supabase connection string with SSL enabled
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL,
  ssl: false,
});

// Log connection status
pool.on('connect', () => {
  console.log('✅ Connected to Supabase PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

export default pool;
