import { Router } from "express";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const router = Router();

router.get("/", async (request, response) => {
  const products = await Product.find().sort({ addedDate: -1 });
  response.json(products);
});

router.get("/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid product ID." });
  }
  const product = await Product.findById(request.params.id);
  if (!product) {
    return response.status(404).json({ message: "Product not found." });
  }
  response.json(product);
});

router.post("/", async (request, response) => {
  const product = await Product.create(request.body);
  response.status(201).json(product);
});

router.put("/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid product ID." });
  }
  const product = await Product.findByIdAndUpdate(
    request.params.id,
    request.body,
    { new: true, runValidators: true },
  );
  if (!product) {
    return response.status(404).json({ message: "Product not found." });
  }
  response.json(product);
});

router.delete("/:id", async (request, response) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid product ID." });
  }
  const product = await Product.findByIdAndDelete(request.params.id);
  if (!product) {
    return response.status(404).json({ message: "Product not found." });
  }
  response.status(204).end();
});

export default router;
