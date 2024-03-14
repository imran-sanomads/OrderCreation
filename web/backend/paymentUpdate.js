import axios from 'axios';
import executeMutation from './mutation.js';
import dotenv from 'dotenv';
dotenv.config();
const baseUrl = "https://sn-imran-testing-two.myshopify.com";
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
async function processOrderPayment(orderData) {
    try {
      const orderId = orderData.tags;
        if (!orderId) {
            console.error('Order ID not found in tags.');
            return;
        }
        const url = `${baseUrl}/admin/api/2023-10/orders/${orderId}.json`;
        const headers = {
            'X-Shopify-Access-Token': accessToken,
            "Content-Type": "application/json",
        };
        const response = await axios.get(url, { headers });
        if (!response.data) {
            console.error(`Error fetching order: ${response.statusText}`);
            return;
        }
        const matchingOrder = response.data.order;
        console.log("match:",matchingOrder);
      if (matchingOrder) {
        console.log(`Order with ID ${matchingOrder.id} has tag: ${orderData.id}`);
          const ORDER_MARK_AS_PAID = `
            mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
              orderMarkAsPaid(input: $input) {
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
          const variables = {
            input: {
              id: matchingOrder.admin_graphql_api_id, 
            },
          };
          const markPaidResponse = await executeMutation(ORDER_MARK_AS_PAID, variables);
          if (markPaidResponse.orderMarkAsPaid.userErrors.length > 0) {
            console.error(
              'Error marking the order as paid:',
              markPaidResponse.orderMarkAsPaid.userErrors
            );
          } else {
            console.log(`Order ${matchingOrder.id} successfully marked as paid.`);
          }
        } else {
          console.error(`Payment failed for order ${matchingOrder.id}:`, paymentProcessingResult.error);
        }
    } catch (error) {
      console.error(`Error processing order payment:`);
    }
  }
  export default processOrderPayment;