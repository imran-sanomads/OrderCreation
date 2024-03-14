import express from 'express';
import { fetchAndSaveProducts } from './productmiddleware.js';
const router = express.Router();
router.get('/sync-products', async (req, res) => {
  try {
    await fetchAndSaveProducts();
    res.json({ message: 'Products fetched and saved successfully!' });
  } catch (error) {
    console.error('Error fetching and saving products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
export default router;