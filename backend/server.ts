import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();

// Accept larger payloads for base64 images
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/texflow';

type Category = 'Fabric' | 'Towel' | 'Garment' | 'Other';
type TransactionType = 'Purchase' | 'Sale';
type TxStatus = 'Pending' | 'Paid';

interface ProductPayload {
  name: string;
  category: Category;
  sku: string;
  variant: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  description: string;
  image?: string;
}

interface SupplierPayload {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
}

interface CustomerPayload {
  name: string;
  phone: string;
  email: string;
}

interface TransactionPayload {
  userId?: string;
  type: TransactionType;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  taxAmount?: number;
  date: string;
  status: TxStatus;
  entityName: string;
}

const parseNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

// Schemas
const productSchema = new mongoose.Schema<ProductPayload>(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['Fabric', 'Towel', 'Garment', 'Other'], default: 'Fabric' },
    sku: { type: String, required: true, unique: true },
    variant: { type: String, default: '' },
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    description: { type: String, default: '' },
    image: { type: String }
  },
  { versionKey: false, timestamps: true }
);

const supplierSchema = new mongoose.Schema<SupplierPayload>(
  {
    name: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  { versionKey: false, timestamps: true }
);

const customerSchema = new mongoose.Schema<CustomerPayload>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true }
  },
  { versionKey: false, timestamps: true }
);

const transactionSchema = new mongoose.Schema<TransactionPayload>(
  {
    userId: String,
    type: { type: String, enum: ['Purchase', 'Sale'], required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    taxAmount: Number,
    date: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Paid' },
    entityName: { type: String, required: true }
  },
  { versionKey: false, timestamps: true }
);

const ProductModel = mongoose.model('Product', productSchema);
const SupplierModel = mongoose.model('Supplier', supplierSchema);
const CustomerModel = mongoose.model('Customer', customerSchema);
const TransactionModel = mongoose.model('Transaction', transactionSchema);

const toClient = <T extends { _id: unknown }>(doc: T): T & { id: string } => {
  const plain = JSON.parse(JSON.stringify(doc));
  plain.id = String(plain._id);
  return plain;
};

const seedIfEmpty = async () => {
  const productsCount = await ProductModel.estimatedDocumentCount();
  const suppliersCount = await SupplierModel.estimatedDocumentCount();
  const customersCount = await CustomerModel.estimatedDocumentCount();

  if (productsCount === 0) {
    await ProductModel.insertMany([
      {
        name: 'Cotton Silk Blend',
        category: 'Fabric',
        sku: 'TEX-M001',
        variant: 'Gold / 100m',
        costPrice: 500,
        sellingPrice: 850,
        stock: 45,
        description: 'Luxury cotton silk blend for high-end garments.',
        image: 'https://picsum.photos/seed/texm1/200/200'
      },
      {
        name: 'Microfiber Towel',
        category: 'Towel',
        sku: 'TEX-M002',
        variant: 'Blue / Set of 4',
        costPrice: 200,
        sellingPrice: 450,
        stock: 12,
        description: 'Quick-dry microfiber towels.',
        image: 'https://picsum.photos/seed/texm2/200/200'
      }
    ]);
  }

  if (suppliersCount === 0) {
    await SupplierModel.create({
      name: 'Local Fabrics Co',
      contactPerson: 'John Doe',
      phone: '1234567890',
      email: 'contact@localfabrics.com'
    });
  }

  if (customersCount === 0) {
    await CustomerModel.create({
      name: 'Walk-in Customer',
      phone: '9999999999',
      email: 'walkin@example.com'
    });
  }
};

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    storage: 'mongo',
    mongoUri: MONGODB_URI,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Products
app.get('/api/products', async (_req, res, next) => {
  try {
    const items = await ProductModel.find().sort({ createdAt: -1 }).lean();
    return res.json(items.map((d) => toClient(d)));
  } catch (err) {
    return next(err);
  }
});

app.post('/api/products', async (req, res, next) => {
  try {
    const body = req.body as Partial<ProductPayload>;

    if (!body.name || !body.sku) {
      return res.status(400).json({ message: 'name and sku are required' });
    }

    const duplicate = await ProductModel.findOne({ sku: body.sku }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'SKU already exists' });
    }

    const created = await ProductModel.create({
      name: body.name,
      category: body.category || 'Fabric',
      sku: body.sku,
      variant: body.variant || '',
      costPrice: parseNumber(body.costPrice),
      sellingPrice: parseNumber(body.sellingPrice),
      stock: parseNumber(body.stock),
      description: body.description || '',
      image: body.image
    });

    return res.status(201).json(toClient(created.toObject()));
  } catch (err) {
    return next(err);
  }
});

app.patch('/api/products/:id', async (req, res, next) => {
  try {
    const existing = await ProductModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const nextData = { ...existing.toObject(), ...req.body } as any;
    if (!nextData.name || !nextData.sku) {
      return res.status(400).json({ message: 'name and sku are required' });
    }

    const duplicate = await ProductModel.findOne({ sku: nextData.sku, _id: { $ne: req.params.id } }).lean();
    if (duplicate) {
      return res.status(409).json({ message: 'SKU already exists' });
    }

    const updated = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        costPrice: parseNumber(nextData.costPrice),
        sellingPrice: parseNumber(nextData.sellingPrice),
        stock: parseNumber(nextData.stock)
      },
      { new: true }
    ).lean();

    return res.json(toClient(updated as any));
  } catch (err) {
    return next(err);
  }
});

app.delete('/api/products/:id', async (req, res, next) => {
  try {
    const deleted = await ProductModel.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await TransactionModel.deleteMany({ productId: req.params.id });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

// Transactions
app.get('/api/transactions', async (_req, res, next) => {
  try {
    const txs = await TransactionModel.find().sort({ date: -1 }).lean();
    return res.json(txs.map((d) => toClient(d)));
  } catch (err) {
    return next(err);
  }
});

app.post('/api/transactions', async (req, res, next) => {
  try {
    const body = req.body as Partial<TransactionPayload>;

    if (!body.type || !body.productId || !body.quantity) {
      return res.status(400).json({ message: 'type, productId, quantity are required' });
    }

    const product = await ProductModel.findById(body.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found for transaction' });
    }

    const quantity = Math.max(1, parseNumber(body.quantity, 1));
    const unitPrice = parseNumber(body.unitPrice, body.type === 'Purchase' ? product.costPrice : product.sellingPrice);
    const taxAmount = parseNumber(body.taxAmount, 0);

    if (body.type === 'Sale' && product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock for sale transaction' });
    }

    product.stock += body.type === 'Purchase' ? quantity : -quantity;
    await product.save();

    const tx = await TransactionModel.create({
      userId: body.userId,
      type: body.type,
      productId: String(product._id),
      productName: body.productName || product.name,
      quantity,
      unitPrice,
      totalAmount: parseNumber(body.totalAmount, quantity * unitPrice + taxAmount),
      taxAmount,
      date: body.date || new Date().toISOString(),
      status: (body.status as TxStatus) || 'Paid',
      entityName: body.entityName || (body.type === 'Purchase' ? 'Supplier' : 'Walk-in Customer')
    });

    return res.status(201).json(toClient(tx.toObject()));
  } catch (err) {
    return next(err);
  }
});

// Suppliers
app.get('/api/suppliers', async (_req, res, next) => {
  try {
    const items = await SupplierModel.find().sort({ createdAt: -1 }).lean();
    return res.json(items.map((d) => toClient(d)));
  } catch (err) {
    return next(err);
  }
});

app.post('/api/suppliers', async (req, res, next) => {
  try {
    const body = req.body as Partial<SupplierPayload>;

    if (!body.name || !body.contactPerson || !body.phone || !body.email) {
      return res.status(400).json({ message: 'name, contactPerson, phone and email are required' });
    }

    const created = await SupplierModel.create({
      name: body.name,
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email
    });

    return res.status(201).json(toClient(created.toObject()));
  } catch (err) {
    return next(err);
  }
});

app.patch('/api/suppliers/:id', async (req, res, next) => {
  try {
    const updated = await SupplierModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    return res.json(toClient(updated));
  } catch (err) {
    return next(err);
  }
});

// Customers
app.get('/api/customers', async (_req, res, next) => {
  try {
    const items = await CustomerModel.find().sort({ createdAt: -1 }).lean();
    return res.json(items.map((d) => toClient(d)));
  } catch (err) {
    return next(err);
  }
});

app.post('/api/customers', async (req, res, next) => {
  try {
    const body = req.body as Partial<CustomerPayload>;

    if (!body.name || !body.phone || !body.email) {
      return res.status(400).json({ message: 'name, phone and email are required' });
    }

    const created = await CustomerModel.create({
      name: body.name,
      phone: body.phone,
      email: body.email
    });

    return res.status(201).json(toClient(created.toObject()));
  } catch (err) {
    return next(err);
  }
});

app.patch('/api/customers/:id', async (req, res, next) => {
  try {
    const updated = await CustomerModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    return res.json(toClient(updated));
  } catch (err) {
    return next(err);
  }
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Payload too large. Reduce image size or increase server JSON limit.'
    });
  }

  console.error('API error:', err?.message || err);
  return res.status(500).json({ message: err?.message || 'Internal server error' });
});

async function bootstrap() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB:', MONGODB_URI);

  await seedIfEmpty();

  app.listen(PORT, () => {
    console.log('--- TEXFLOW BACKEND ---');
    console.log(`🚀 API Server running at http://localhost:${PORT}`);
    console.log('💾 Storage mode: MongoDB');
  });
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error?.message || error);
  process.exit(1);
});
