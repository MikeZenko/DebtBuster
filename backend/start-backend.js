#!/usr/bin/env node

/**
 * Backend Setup and Start Script for DebtTruth Coach
 * This script helps set up environment variables and start the backend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 DebtTruth Coach Backend Setup\n');

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envTemplate = `# DebtTruth Coach Backend Environment Configuration
# Generated on ${new Date().toISOString()}

# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/debttruth?schema=public"

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="debttruth-jwt-secret-change-this-in-production-${Math.random().toString(36)}"
JWT_REFRESH_SECRET="debttruth-refresh-secret-change-this-in-production-${Math.random().toString(36)}"
JWT_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# Plaid Configuration (Add your real Plaid credentials)
PLAID_CLIENT_ID="your_plaid_client_id_here"
PLAID_SECRET="your_plaid_secret_here"
PLAID_ENV="sandbox"
PLAID_PRODUCTS="transactions,auth,identity"
PLAID_COUNTRY_CODES="US,CA"

# Server Configuration
PORT=3001
NODE_ENV="development"
CORS_ORIGINS="http://localhost:3000,https://debttruth-coach-im47q6o6m-mikezenkos-projects.vercel.app"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Optional: Monitoring
# SENTRY_DSN="your-sentry-dsn"
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with default values');
  console.log('⚠️  IMPORTANT: Update PLAID_CLIENT_ID and PLAID_SECRET with your real credentials!');
} else {
  console.log('✅ .env file already exists');
}

// Check if PostgreSQL is available
console.log('\n🔍 Checking database connection...');
try {
  // Try to generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: __dirname });
  console.log('✅ Prisma client generated successfully');
  
  // Try to check database connection (this will fail if DB is not set up, but that's ok)
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'pipe', cwd: __dirname });
    console.log('✅ Database connection successful');
  } catch (error) {
    console.log('⚠️  Database not accessible - you may need to set up PostgreSQL');
    console.log('   For development, you can use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=debttruth postgres');
  }
} catch (error) {
  console.log('⚠️  Could not generate Prisma client - this is normal for first setup');
}

console.log('\n🚀 Starting backend server...');
console.log('📍 Server will be available at: http://localhost:3001');
console.log('📚 API Documentation: http://localhost:3001/api');
console.log('🔍 Health Check: http://localhost:3001/health');

try {
  // Start the development server
  execSync('npm run dev', { stdio: 'inherit', cwd: __dirname });
} catch (error) {
  console.error('\n❌ Failed to start server');
  console.error('Make sure you have set up your database and environment variables correctly');
  console.error('Check the .env file and update the DATABASE_URL and Plaid credentials');
  process.exit(1);
}
