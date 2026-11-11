import "dotenv/config";
import cors from "cors";
import dns from "node:dns";
import express from "express";
import mongoose from "mongoose";
import process from "node:process";
import productRoutes from "./routes/products.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const port = process.env.PORT || 5000;
const mongoUri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/product_inventory";

app.use(cors());
app.use(express.json());
app.use("/api/products", productRoutes);
app.use((request, response) => {
  response.status(404).json({ message: "Not found." });
});
app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  const isBadRequest =
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    (error instanceof SyntaxError && "body" in error);
  console.error(error.message);
  response.status(isBadRequest ? 400 : 500).json({
    message: isBadRequest ? "Invalid product data." : "Server error.",
  });
});

try {
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
  app.listen(port, () => console.log(`API server listening on port ${port}`));
} catch (error) {
  console.error(`MongoDB connection failed: ${error.message}`);
  process.exit(1);
}
