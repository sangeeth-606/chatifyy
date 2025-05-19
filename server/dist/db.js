import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();
// use `prisma` in your application to read and write data in your DB
/**
 * Checks the database connection and logs the status
 */
export async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        return true;
    }
    catch (error) {
        console.error('❌ Database connection error:', error.message);
        return false;
    }
}
export default prisma;
