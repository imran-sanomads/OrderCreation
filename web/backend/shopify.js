import {LATEST_API_VERSION} from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-01";
import { PostgreSQLSessionStorage } from "@shopify/shopify-app-session-storage-postgresql";
const shopify = shopifyApp ({
    sessionStorage: new PostgreSQLSessionStorage(
      'postgresql://postgres:123456ok@localhost:5433/Test',
    ),
    api: {
      apiVersion: LATEST_API_VERSION,
      restResources,
    },
    auth: {
      path: "/api/auth",
      callbackPath: "/api/auth/callback",
    },
    webhooks: {
      path: "/api/webhooks",
    },
  })  
  export default shopify; 