
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
// Explicitly import process to ensure Node.js types are correctly applied
import process from 'process';

/**
 * TEXFLOW BACKEND SERVER
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install Node.js
 * 2. Run: npm init -y
 * 3. Run: npm install express mongoose cors dotenv
 * 4. Save this code to a file (e.g., server.js)
 * 5. Run: node server.js
 * 
 * Default PORT: 5000
 * Default DB: mongodb://localhost:27017/texflow
 */

const app = express();

// Middleware
app.use(cors());
// Fix: Cast express.json() to any to bypass the type incompatibility between Connect's NextHandleFunction and Express's PathParams/RequestHandler.
app.use(express.json() as any);

// MongoDB Schemas
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, enum: ['Fabric', 'Towel', 'Garment', 'Other'], default: 'Fabric' },
  sku: { type: String, unique: true, required: true },
  variant: String,
  costPrice: Number,
  sellingPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  description: String,
  image: String
});

const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Purchase', 'Sale'], required: true },
  productId: { type: String, required: true },
  productName: String,
  quantity: { type: Number, required: true },
  unitPrice: Number,
  totalAmount: Number,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
  entityName: String
});

const Product = mongoose.model('Product', productSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.patch('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ date: -1 });
    res.json(txs);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const tx = new Transaction(req.body);
    await tx.save();
    
    // Automatic stock synchronization
    const qtyChange = tx.type === 'Purchase' ? tx.quantity : -tx.quantity;
    await Product.findByIdAndUpdate(tx.productId, { $inc: { stock: qtyChange } });
    
    res.status(201).json(tx);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// Environment Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/texflow';
const PORT = process.env.PORT || 5000;

// Initialize Server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('--- TEXFLOW BACKEND ---');
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 API Server running at http://localhost:${PORT}`);
      console.log('Press Ctrl+C to stop');
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    // Explicitly using process.exit(1) to terminate on failure, with import to resolve type issues
    process.exit(1);
  });
