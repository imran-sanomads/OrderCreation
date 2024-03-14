import { DeliveryMethod } from "@shopify/shopify-api";
import processOrder from "../processOrder.js";
import processOrderUpdate from "../orderUpdate.js";
import processOrderFulfillment from "../fulfillment.js";
import processOrderPayment from "../paymentUpdate.js";
import dotenv from 'dotenv';
dotenv.config();
const receivedWebhooks = {};
// webhooks
export default {
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      if (receivedWebhooks[webhookId]) return;
      receivedWebhooks[webhookId] = true;
      console.log(`Received order creation webhook`);
      try {
        const orderData = JSON.parse(body);
        console.log("Order:");
        await processOrder(orderData);
      } catch (error) {
        console.error(`Error processing order:`, error);
      }
    },
  },
  ORDERS_UPDATED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      if (receivedWebhooks[webhookId]) return;
      receivedWebhooks[webhookId] = true;
      console.log(`Received order update webhook`);
      try {
        const orderData = JSON.parse(body);
        console.log("Order update:");
        await processOrderUpdate(orderData);
      } catch (error) {
        console.error(`Error processing order update:`, error);
      }
    },
  },
  FULFILLMENTS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      if (receivedWebhooks[webhookId]) return;
      receivedWebhooks[webhookId] = true;
      console.log(`Received fulfillment created webhook`);
      try {
        const fulfillmentData = JSON.parse(body);
        console.log("Fulfillment data:",fulfillmentData);
        await processOrderFulfillment(fulfillmentData);
      } catch (error) {
        console.error(`Error processing fulfillment creation:`);
      }
    },
  },
  ORDERS_PAID: { 
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      if (receivedWebhooks[webhookId]) return;
      receivedWebhooks[webhookId] = true;
      console.log(`Received order payment webhook`);
      try {
        const orderData = JSON.parse(body);
        console.log("Order payment data:");
        await processOrderPayment(orderData); 
      } catch (error) {
        console.error(`Error processing order payment:`, error);
      }
    },
  },
};