import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Plaid
  PLAID_CLIENT_ID: z.string(),
  PLAID_SECRET: z.string(),
  PLAID_ENV: z.enum(['sandbox', 'development', 'production']).default('sandbox'),
  PLAID_PRODUCTS: z.string().default('transactions,auth,identity'),
  PLAID_COUNTRY_CODES: z.string().default('US,CA'),
  
  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  RATE_LIMIT_WINDOW: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  
  // Optional
  SENTRY_DSN: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Invalid environment configuration:');
  if (error instanceof z.ZodError) {
    error.errors.forEach(err => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
  }
  process.exit(1);
}

export default env;

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development';
export const isProduction = () => env.NODE_ENV === 'production';
export const isTest = () => env.NODE_ENV === 'test';

export const getCorsOrigins = () => env.CORS_ORIGINS.split(',').map(origin => origin.trim());
export const getPlaidProducts = () => env.PLAID_PRODUCTS.split(',').map(product => product.trim());
export const getPlaidCountryCodes = () => env.PLAID_COUNTRY_CODES.split(',').map(code => code.trim());
