import fetchOrders from './fetchOrders.js';
import executeMutation from './mutation.js';
async function processOrderPayment(orderData) {
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
      console.error(`Error processing order payment:`, error);
    }
  }
  export default processOrderPayment;