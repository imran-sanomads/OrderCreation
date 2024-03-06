import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
const accessToken = process.env.STORE_B_ACCESS_TOKEN;
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
    console.error('Error executing GraphQL mutation:', error.response ? error.response.data : error.message);
    throw error; // Rethrow to allow caller handling
  }
}
export default executeMutation;