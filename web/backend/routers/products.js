import express from 'express';
import { fetchProducts } from '../DBproducts.js'; 
const router = express.Router();
router.get('/products', async (req, res) => {
    try {
        const products = await fetchProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
export default router;