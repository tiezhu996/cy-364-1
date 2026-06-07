#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until node -e "
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'app',
  user: process.env.DB_USER || 'app',
  password: process.env.DB_PASSWORD || 'app_pwd',
});
client.connect()
  .then(() => {
    console.log('Database connected successfully');
    client.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });
" 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "Generating Prisma client..."
npx prisma generate

echo "Verifying database tables exist..."
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const storeCount = await prisma.store.count();
    const skuCount = await prisma.sku.count();
    const stockCount = await prisma.stock.count();
    const alertCount = await prisma.stockAlert.count({ where: { status: 'pending' } });
    console.log('✅ Database verification:');
    console.log('   - Stores:', storeCount);
    console.log('   - SKUs:', skuCount);
    console.log('   - Stock records:', stockCount);
    console.log('   - Pending alerts:', alertCount);
    await prisma.\$disconnect();
  } catch (err) {
    console.error('❌ Database verification failed:', err.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

verify();
" 2>&1

echo "Starting backend server..."
exec node dist/main.js
