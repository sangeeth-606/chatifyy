import { PrismaClient } from './generated/prisma/index.js'

const prisma = new PrismaClient()

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    return true;
  } catch (error:any) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

export default prisma