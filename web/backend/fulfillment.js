import axios from 'axios';
import fetchOrders from './fetchOrders.js'; // Import fetchOrders function

async function processOrderFulfillment(fulfillmentData) {
    try {
        const allOrders = await fetchOrders();
        const fulfillmentOrderId = fulfillmentData.order_id;
        const matchingOrder = allOrders.find(order => order.tags && order.tags.includes(fulfillmentOrderId));
        if (matchingOrder) {
            console.log(`Fulfillment order ${fulfillmentOrderId} is matched with order ID ${matchingOrder.id}`);
            const fulfillment = {
                "api_version": "2024-01",
                line_items_by_fulfillment_order: [
                    {
                        "fulfillment_order_id": parseInt(matchingOrder.id),
                        "fulfillment_order_line_items": matchingOrder.line_items.map(lineItem => ({
                            "id": parseInt(lineItem.id),
                            "quantity": parseInt(lineItem.quantity)
                        }))
                    }
                ]
            };
            console.log("Fulfillment data:", JSON.stringify(fulfillment, null, 2));
            const response = await axios.post(
                `https://sn-imran-testing-two.myshopify.com/admin/api/2024-01/fulfillments.json`,
                fulfillment,
                {
                    headers: {
                        "X-Shopify-Access-Token": accessToken,
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log("Fulfillment request sent:", response.data);
        } else {
            console.log(`No matching order found for fulfillment:`);
        }
    } catch (error) {
        console.error(`Error processing order fulfillment:`, error.response ? error.response.data : error.message);
    }
}

export default processOrderFulfillment;
