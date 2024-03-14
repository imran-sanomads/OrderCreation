import axios from 'axios';
import dotenv from 'dotenv';
import { fetchProducts } from './DBproducts.js';
dotenv.config();
const baseUrl = "https://sn-imran-testing-two.myshopify.com";
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
const storeAUrl = "https://sn-imran-testing.myshopify.com";
const storeAAccessToken = process.env.STORE_A_ACCESS_TOKEN;
async function processOrder(orderData) {
    try {
        const storeBProducts = await fetchProducts();
        console.log("Store B Products:");
        const matchingProducts = [];
        for (const lineItem of orderData.line_items) {
            const productName = lineItem.title;
            const sku = lineItem.sku;
            const matchingProduct = storeBProducts.find(product => {
                return product.variants.some(variant => variant.sku === sku);
            });
            console.log("match:",matchingProduct);
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
                console.log(`Order created in Store B successfully.`,response);
                const storeBOrderId = response.data.order.id;
                console.log("id:",storeBOrderId);
                // Update Store A order tags with Store B order ID
                const storeAOrderUpdate = {
                    order: {
                        id:  parseInt(orderData.id),
                        tags: `${storeBOrderId}`,
                    },
                };
                console.log("update:",storeAOrderUpdate);
                const updateResponse = await axios.put(
                    `${storeAUrl}/admin/api/2024-01/orders/${orderData.id}.json`,
                     storeAOrderUpdate ,
                    {
                        headers: {
                            "X-Shopify-Access-Token": storeAAccessToken,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (updateResponse.status === 200) {
                    console.log(`Order updated in Store A successfully.`);
                } else {
                    console.error(`Error updating order in Store A: ${updateResponse.statusText}`);
                }
            } else {
                console.error(`Error creating order in Store B: ${response.statusText}`);
            }
        } else {
            console.log("No matching products found, skipping order creation in Store B.");
        }
    } catch (error) {
        console.error("Error processing order:", error.response ? error.response.data : error);
    }
}
export default processOrder;