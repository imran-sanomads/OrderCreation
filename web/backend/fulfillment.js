import axios from 'axios';
import fetchOrders from './fetchOrders.js';
const baseUrl = "https://sn-imran-testing-two.myshopify.com";
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
async function processOrderFulfillment(fulfillmentData) {
  try {
    const allOrders = await fetchOrders();
    const fulfillmentOrderId = fulfillmentData.order_id;
    const matchingOrder = allOrders.find(order => order.tags && order.tags.includes(fulfillmentOrderId));
    if (matchingOrder) {
      console.log(`Fulfillment order ${fulfillmentOrderId} is matched with order ID ${matchingOrder.id}`);
      // fulfillment orders for the matching order
      const fulfillmentOrders = await axios.get(
        `${baseUrl}/admin/api/2024-01/orders/${matchingOrder.id}/fulfillment_orders.json`,
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Fulfillment orders retrieved:");
      const fulfillment = {
        "line_items_by_fulfillment_order": fulfillmentOrders.data.fulfillment_orders.map(fo => ({
          "fulfillment_order_id": fo.id,
          "fulfillment_order_line_items": fo.line_items.map(li => ({
            "id": li.id,
            "quantity": li.quantity
          }))
        }))
      };
      //fulfillment request to Shopify
      const response = await axios.post(
        `${baseUrl}/admin/api/2024-01/fulfillments.json`,
        {fulfillment:fulfillment},
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Fulfillment:");
    } else {
      console.log(`No matching order found for fulfillment:`);
    }
  } catch (error) {
    console.error(`Error processing order fulfillment:`);
  }
}
export default processOrderFulfillment;