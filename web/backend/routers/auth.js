import express from "express";
import shopify from "../shopify.js";
import  webhookHandlers from "../routers/registerwebhook.js"
import authenticateUser from "../middleware/middleware.js";
const router = express.Router();
router.get(shopify.config.auth.path, shopify.auth.begin());
router.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(), 
  authenticateUser,
  shopify.redirectToShopifyOrAppRoot()
 ); 
 router.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers })
);
export default router;