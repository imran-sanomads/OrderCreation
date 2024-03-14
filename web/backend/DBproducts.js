import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function fetchProducts() {
    try {
        const products = await prisma.product.findMany();
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error; 
    }
}