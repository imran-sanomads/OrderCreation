import { DeliveryMethod } from "@shopify/shopify-api";
import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();
const receivedWebhooks = {};
const baseUrl = "https://sn-imran-testing-two.myshopify.com";
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
// function to fetch products 
async function fetchProducts() {
  const url = `${baseUrl}/admin/api/2024-01/products.json`;
  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };
  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      return response.data.products;
    } else {
      console.error(`Error fetching products: ${response.statusText}`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}
// function to fetch orders
async function fetchOrders() {
  const url = `${baseUrl}/admin/api/2024-01/orders.json`;
  const headers = {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };
  try {
    const response = await axios.get(url, { headers });
    if (response.status === 200) {
      return response.data.orders;
    } else {
      console.error(`Error fetching orders: ${response.statusText}`);
      return [];
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}
// this function is for order process
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
    console.error("Error processing order:",error.response.data);
  }
}
// this function is for mutation
async function executeMutation(ORDER_EDIT_BEGIN, variables) {
  const defaultOptions = {
    url: 'https://sn-imran-testing-two.myshopify.com/admin/api/2024-01/graphql.json',
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    data: {
      query: ORDER_EDIT_BEGIN,
      variables,
    },
  };
  try {
    const response = await axios(defaultOptions);
    if (response.data.errors) {
      console.error('GraphQL mutation errors:', response.data.errors);
      throw new Error('GraphQL mutation failed');
    } else {
      console.log('API request successful!');
      return response.data.data;
    }
  } catch (error) {
    console.error('Error executing GraphQL mutation:', error.response.data);
  }
}
//this function is for order update
async function processOrderUpdate(orderData) {
  try {
    const allOrders = await fetchOrders();
    const matchingOrder = allOrders.find(order =>
      order.tags &&
      order.tags.includes(orderData.id) &&
      order.line_items &&
      order.line_items.length > 0 &&
      orderData.line_items &&
      orderData.line_items.length > 0
    );
    if (matchingOrder) {
      console.log(`Order with ID ${matchingOrder.id} has tag: ${orderData.id}`);
      for (const updateItem of orderData.line_items) {
        const matchingItem = matchingOrder.line_items.find(orderItem => orderItem.title === updateItem.title);
        if (matchingItem) {
          console.log(`Matching line item found for title: ${updateItem.title}`);
          // Begin the order edit session
          const ORDER_EDIT_BEGIN = `
          mutation orderEditBegin($id: ID!) {
            orderEditBegin(id: $id) {
              calculatedOrder {
                id
                lineItems (first: 5){
                  edges {
                    node {
                      id
                      title
                      quantity
                    }
                  }
                }
              }
              userErrors {
                field
                message
              }
            }
          }
          `;
          const variables = { id: matchingOrder.admin_graphql_api_id };
          const beginResponse = await executeMutation(ORDER_EDIT_BEGIN, variables);
          if (beginResponse.orderEditBegin.userErrors.length > 0) {
            console.error('Error beginning the order edit:', beginResponse.orderEditBegin.userErrors);
            return;
          }
          const calculatedOrder = beginResponse.orderEditBegin.calculatedOrder;
          const orderEditId = calculatedOrder.id;
          const lineItems = calculatedOrder.lineItems.edges;
          console.log('Order edit begin successful. Line items:');
          let lineItemId;
          lineItems.forEach((lineItem, index) => {
            console.log(`Line Item ${index + 1}:`);
            console.log(`ID: ${lineItem.node.id}`);
            console.log(`Quantity: ${lineItem.node.quantity}`);
            console.log(`Title: ${lineItem.node.title}`);
            // Assign line item ID to lineItemId here
            lineItemId = lineItem.node.id;
          });
          // Set the new quantity for the matching line item
          const ORDER_EDIT_SET_QUANTITY = `
          mutation orderEditSetQuantity($id: ID!, $lineItemId: ID!, $quantity: Int!, $restock: Boolean) {
            orderEditSetQuantity(id: $id, lineItemId: $lineItemId, quantity: $quantity, restock: $restock) {
              calculatedLineItem {
                id
                quantity
              }
              calculatedOrder {
                id
              }
              userErrors {
                field
                message
              }
            }
          }
          `;
          const editVariables = {
            id: orderEditId,
            lineItemId: lineItemId,
            quantity: updateItem.fulfillable_quantity,
            restock: true
          };
          const editResponse = await executeMutation(ORDER_EDIT_SET_QUANTITY, editVariables);
          if (editResponse && editResponse.orderEditSetQuantity.userErrors.length > 0) {
            console.error('Error setting the quantity on the order line item:', editResponse.orderEditSetQuantity.userErrors);
          } else {
            console.log('Order line item quantity updated successfully:');
          }
          // Commit the order edit
          const ORDER_EDIT_COMMIT = `
          mutation orderEditCommit($id: ID!) {
            orderEditCommit(id: $id) {
              order {
                id
                
              }
              userErrors {
                field
                message
              }
            }
          }
          `;
          const commitVariables = {
            id: orderEditId,
          };
          const commitResponse = await executeMutation(ORDER_EDIT_COMMIT, commitVariables);
          if (commitResponse && commitResponse.orderEditCommit.userErrors.length > 0) {
            console.error('Error committing the order edit:', commitResponse.orderEditCommit.userErrors);
          } else {
            console.log('Order edit committed successfully:');
          }
        } else {
          console.log(`No matching line item found for title: ${updateItem.title}`);
        }
      }
    } else {
      console.log(`No matching order found for tag: ${orderData.id}`);
    }
  } catch (error) {
    console.error(`Error processing order update:`, error.response);
  }
}
// this function is for order fulfillment
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
      }
      console.log("check:", JSON.stringify(fulfillment, null, 2));
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
    }
    else {
      console.log(`No matching order found for fulfillment:`);
    }
  } catch (error) {
    console.error(`Error processing order fulfillment:`, error.response.data);
  }
}
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
        console.log("Fulfillment data:", fulfillmentData);
        await processOrderFulfillment(fulfillmentData);
      } catch (error) {
        console.error(`Error processing fulfillment creation:`, error);
      }
    },
  },
};