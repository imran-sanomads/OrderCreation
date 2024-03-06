import axios from 'axios';
import dotenv from 'dotenv';
import fetchProducts from './fetchProducts.js';
dotenv.config();
const baseUrl = "https://sn-imran-testing-two.myshopify.com";
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
async function processOrder(orderData) {
    try {
        const storeBProducts = await fetchProducts();
        console.log("Store B Products:");
        const matchingProducts = [];
        for (const lineItem of orderData.line_items) {
            const productName = lineItem.title;
            const matchingProduct = storeBProducts.find(product => product.title === productName);
            if (matchingProduct) {
                console.log(`Matching product found for: ${productName}`);
                matchingProducts.push({
                    variant_id: matchingProduct.variants[0].id,
                    quantity: lineItem.quantity,
                });
            } else {
                console.log(`No matching product found for: ${productName}`);
            }
        }
        if (matchingProducts.length > 0) {
            const storeBOrder = {
                line_items: matchingProducts,
                customer: orderData.customer,
                tags: `${orderData.id}`,
            };
            console.log("store B order:");
            const response = await axios.post(
                `${baseUrl}/admin/api/2024-01/orders.json`,
                { order: storeBOrder },
                {
                    headers: {
                        "X-Shopify-Access-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.status === 201) {
                console.log(`Order created in Store B successfully.`);
            } else {
                console.error(`Error creating order in Store B: ${response.statusText}`);
            }
        } else {
            console.log("No matching products found, skipping order creation in store B.");
        }
    } catch (error) {
        console.error("Error processing order:", error.response ? error.response.data : error);
    }
}
export default processOrder;