import express from 'express'
import shopify from './shopify.js';
import syncRouter from './middleware/fetchproducts.js'
import productRouter from './routers/products.js'
import router from './routers/auth.js';
import serveStatic from 'serve-static';
import { readFileSync } from 'fs';
import { join } from 'path'; 
const app = express(); 
app.use(router);
const STATIC_PATH = 
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/../frontend/dist`
    : `${process.cwd()}/../frontend/`;
const port = parseInt(
    process.env.BACKEND_PORT || process.env.PORT || "3000",
    10
  );
app.use(serveStatic(STATIC_PATH, { index: false }));
app.use('/api', productRouter);
app.use('/api', syncRouter);

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});
app.listen(port, () =>{
    console.log(`Server is running on port ${port}`);
})