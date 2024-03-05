import shopify from "../shopify.js";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const fetchAndSaveProducts = async (session) => {
  let pageInfo;
  do {
    const response = await shopify.api.rest.Product.all({
      ...pageInfo?.nextPage?.query,
      session,
      limit: 1,
    });
    const pageProducts = response.data;
    for (const product of pageProducts) {
      const existingProduct = await prisma.product.findUnique({
        where: {
          product_id: product.id.toString(),
        },
      }); 
      if (!existingProduct) {
        await prisma.product.create({
          data: {
            title: product.title, 
            status: product.status,
            vendor: product.vendor,
            product_id: product.id.toString(),
            image: product.image.src,
            description: product.body_html || null,
            product_type: product.product_type,
            created_at: product.created_at,
            published_at: product.published_at,
            updated_at: product.updated_at,
            handle: product.handle,
            published_scope: product.published_scope,
            admin_graphql_api_id: product.admin_graphql_api_id,
            template_suffix: product.template_suffix,
            variants:product.variants,
            options:product.options,
            tags:product.tags,
          },
        });
      }
    }
    pageInfo = response.pageInfo;
  } while (pageInfo?.nextPage);
};
