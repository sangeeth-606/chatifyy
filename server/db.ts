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
      
      await prisma.$connect();
      console.log('Database connection successful');
      return true;
    } catch (error:any) {
      retries++;
      console.error(`❌ Database connection error (attempt ${retries}/${MAX_RETRIES}):`, error.message);
      
      // Additional diagnostic information
      if (error.code) {
        console.error(`Error code: ${error.code}`);
      }
      
      if (error.message.includes('Connection refused') || error.message.includes("Can't reach database server")) {
        console.error('This may be due to network restrictions. Please check:');
        console.error('1. Your database firewall rules allow connections from Render IPs');
        console.error('2. Your DATABASE_URL includes proper SSL configuration (sslmode=require)');
        console.error('3. The database server is running and accessible from outside networks');
        
        // Supabase specific guidance
        if (process.env.DATABASE_URL?.includes('supabase')) {
          console.error('\nSUPABASE SPECIFIC GUIDANCE:');
          console.error('- Go to your Supabase project dashboard → Settings → Database');
          console.error('- Under "Connection Pooling", ensure "Pooler Mode" is set to "Transaction"');
          console.error('- Under "Network", add Render\'s IP addresses to the allowed list:');
          console.error('  Render IP ranges: https://render.com/docs/infrastructure#egress-ip-addresses');
        }
      }
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_DELAY_MS/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
  }
  
  console.error(`Failed to connect to the database after ${MAX_RETRIES} attempts.`);
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