import { PrismaClient } from './generated/prisma/index.js'

// Initialize Prisma client with SSL configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

export async function checkDatabaseConnection() {
  try {
    console.log('Attempting to connect to database...');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database URL format: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
    
    await prisma.$connect();
    console.log('Database connection successful');
    return true;
  } catch (error:any) {
    console.error('❌ Database connection error:', error.message);
    
    // Additional diagnostic information
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.message.includes('Connection refused') || error.message.includes("Can't reach database server")) {
      console.error('This may be due to network restrictions. Please check:');
      console.error('1. Your database firewall rules allow connections from Render IPs');
      console.error('2. Your DATABASE_URL includes proper SSL configuration (sslmode=require)');
      console.error('3. The database server is running and accessible from outside networks');
    }
    
    return false;
  }
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