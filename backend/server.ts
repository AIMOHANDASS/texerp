import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

/**
 * TEXFLOW BACKEND SERVER (TypeScript)
 */

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ======================
// MongoDB Schemas
// ======================

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ["Fabric", "Towel", "Garment", "Other"], default: "Fabric" },
  sku: { type: String, unique: true, required: true },
  variant: String,
  costPrice: Number,
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  description: String,
  image: String,
});

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ["Purchase", "Sale"], required: true },
  productId: { type: String, required: true },
  productName: String,
  quantity: { type: Number, required: true },
  unitPrice: Number,
  totalAmount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Paid"], default: "Paid" },
  entityName: String,
});

const Product = mongoose.model("Product", productSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

// ======================
// Routes
// ======================

app.get("/api/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/products", async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.patch("/api/products/:id", async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.delete("/api/products/:id", async (req: Request, res: Response) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/transactions", async (req: Request, res: Response) => {
  try {
    const txs = await Transaction.find().sort({ date: -1 });
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/transactions", async (req: Request, res: Response) => {
  try {
    const tx = new Transaction(req.body);
    await tx.save();

    // Auto stock sync
    const qtyChange = tx.type === "Purchase" ? tx.quantity : -tx.quantity;
    await Product.findByIdAndUpdate(tx.productId, { $inc: { stock: qtyChange } });

    res.status(201).json(tx);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// ======================
// Config & Start Server
// ======================

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/texflow";
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`🚀 API running at http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  });
