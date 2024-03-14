import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const storeAToken = process.env.STORE_A_ACCESS_TOKEN;
const storeBToken = process.env.STORE_B_ACCESS_TOKEN;
const storeAUrl = 'https://sn-imran-testing.myshopify.com';
const storeBUrl = 'https://sn-imran-testing-two.myshopify.com'; 
async function fetchProducts() {
  try {
    const combinedProducts = [];
    
    const storeBResponse = await axios.get(`${storeBUrl}/admin/api/2024-01/products.json`, {
      headers: { 'X-Shopify-Access-Token': storeBToken, 'Content-Type': 'application/json' }
    });
    if (storeBResponse.status === 200) {
      combinedProducts.push(...storeBResponse.data.products); 
    } else { 
      console.error(`Error fetching products from Store B: ${storeBResponse.statusText}`);
    }
    const storeAResponse = await axios.get(`${storeAUrl}/admin/api/2024-01/products.json`, {
      headers: { 'X-Shopify-Access-Token': storeAToken, 'Content-Type': 'application/json' }
    });
    if (storeAResponse.status === 200) {
      combinedProducts.push(...storeAResponse.data.products); 
    } else {
      console.error(`Error fetching products from Store A: ${storeAResponse.statusText}`);
    }
    return combinedProducts;
  } catch (error) {
    console.error('Error fetching products from stores:', error.response.data);
    return []; 
  }
}
export default fetchProducts;