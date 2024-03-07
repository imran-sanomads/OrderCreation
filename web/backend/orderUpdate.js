import fetchOrders from './fetchOrders.js';
import executeMutation from './mutation.js';
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
                        lineItemId = lineItem.node.id;
                    });
                    // Set quantity line item
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
                        quantity: updateItem.quantity,
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
                        console.error('Error committing the order edit:');
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
export default processOrderUpdate;