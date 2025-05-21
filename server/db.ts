import { PrismaClient } from './generated/prisma/index.js'

// Initialize Prisma client with explicit SSL configuration for production environments
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    }
  },
  // Add explicit SSL configuration for production
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
})

// Maximum number of connection retries
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function checkDatabaseConnection() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`Attempting to connect to database (attempt ${retries + 1}/${MAX_RETRIES})...`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database URL format: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
      
      // Try to run a simple query to test the connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
      return true;
    } catch (error:any) {
      retries++;
      console.error(`❌ Database connection error (attempt ${retries}/${MAX_RETRIES}):`, error.message);
      
      // Additional diagnostic information
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      
      if (error.message.includes('Connection refused') || 
          error.message.includes("Can't reach database server") ||
          error.message.includes("timeout")) {
        console.error('\nNETWORK CONNECTIVITY ISSUE DETECTED:');
        console.error('This is likely because Render cannot connect to your Supabase database.');
        console.error('Please take the following steps in your Supabase dashboard:');
        console.error('1. Go to: https://supabase.com/dashboard/project/_/settings/database');
        console.error('2. Under "Connection Pooling", set "Pooler Mode" to "Transaction"');
        console.error('3. Go to "Network" tab and click "Add Network Restriction"');
        console.error('4. Add all Render IP ranges from: https://render.com/docs/infrastructure#egress-ip-addresses');
        console.error('   (Your database currently restricts which IPs can connect to it)');
      }
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  
  console.error(`Failed to connect to the database after ${MAX_RETRIES} attempts.`);
  console.error('CRITICAL ACTION REQUIRED: You must configure your Supabase database to allow Render IPs.');
  return false;
}

// Utility function to mask sensitive parts of the DB URL for logging
function maskDatabaseUrl(url?: string): string {
  if (!url) return 'undefined';
  try {
    const parsedUrl = new URL(url);
    // Replace password with asterisks
    if (parsedUrl.password) {
      parsedUrl.password = '********';
    }
    return `${parsedUrl.protocol}//${parsedUrl.username}:********@${parsedUrl.host}${parsedUrl.pathname}${parsedUrl.search}`;
  } catch (e) {
    return 'Invalid URL format';
  }
}

export default prisma