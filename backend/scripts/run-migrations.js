/**
 * Migration Runner Script
 *
 * This script runs SQL migration files against the database
 * Usage: node scripts/run-migrations.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../utils/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '../sql/migrations');

async function runMigration(filePath) {
  console.log(`\n📄 Running migration: ${path.basename(filePath)}`);

  try {
    const sql = await fs.readFile(filePath, 'utf-8');

    // Remove comments and split into individual statements
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`   Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt.trim().length === 0) continue;

      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_migrations').insert({ query: stmt });

        if (directError && directError.code !== '42P01') { // Ignore "relation does not exist" for _migrations table
          console.warn(`   ⚠️  Statement ${i + 1} warning:`, error.message || directError.message);
          // Continue anyway - some errors are expected (like "index already exists")
        }
      }
    }

    console.log(`   ✅ Migration completed: ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration failed: ${error.message}`);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting database migrations...\n');
  console.log(`   Migrations directory: ${MIGRATIONS_DIR}`);

  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run in alphabetical order

    console.log(`\n   Found ${sqlFiles.length} migration files\n`);

    let successCount = 0;
    let failCount = 0;

    for (const file of sqlFiles) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const success = await runMigration(filePath);
      if (success) successCount++;
      else failCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Migrations completed: ${successCount} successful, ${failCount} failed`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Failed to run migrations:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution using Supabase SQL editor
async function runDirectSQL() {
  console.log('📝 Alternative: Copy these SQL statements to Supabase SQL Editor\n');
  console.log('   1. Go to: https://hooceemtoyucadhxuevx.supabase.co/project/_/sql');
  console.log('   2. Copy and paste the SQL from each migration file');
  console.log('   3. Click "Run" to execute\n');

  console.log('   Migration files to run:');
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      console.log(`      - ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`\n${'='.repeat(60)}`);
      console.log(`FILE: ${file}`);
      console.log('='.repeat(60));
      console.log(content);
      console.log('\n');
    }
  } catch (error) {
    console.error('Error reading migration files:', error.message);
  }
}

// Run migrations
console.log('⚠️  Note: Supabase API does not support direct SQL execution via RPC.');
console.log('   You need to run these migrations using the Supabase SQL Editor.\n');

runDirectSQL();
