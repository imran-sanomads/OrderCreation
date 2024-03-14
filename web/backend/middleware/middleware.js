import shopify from "../shopify.js";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const authenticateUser = async (req, res, next) => {
  try {
    const offlineSessionId = await shopify.api.session.getOfflineId(req.query.shop);
    console.log("sessionID:", offlineSessionId);
    const session = res.locals.shopify.session;
    console.log("session:", session);
    next();
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
};
export default authenticateUser;