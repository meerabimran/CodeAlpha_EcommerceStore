import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const defaultProducts = [
  {
    name: 'Wireless Headphones',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    category: 'Electronics',
  },
  {
    name: 'Running Shoes',
    price: 120,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    category: 'Fashion',
  },
  {
    name: 'Smart Watch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    category: 'Electronics',
  },
  {
    name: 'Leather Backpack',
    price: 75.5,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
    category: 'Fashion',
  },
  {
    name: 'Coffee Maker',
    price: 55,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500',
    category: 'Home',
  },
  {
    name: 'Sunglasses',
    price: 35.99,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500',
    category: 'Fashion',
  },
];

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, required: true, trim: true },
});

const Product = mongoose.model('Product', productSchema);

app.get('/', (req, res) => {
  res.send('CodeAlpha API is running.');
});

app.get('/api/products', async (req, res) => {
  const products = await Product.find().sort({ name: 1 }).lean();
  res.json(products);
});

app.post('/api/products/seed', async (req, res) => {
  await Product.bulkWrite(
    defaultProducts.map((product) => ({
      updateOne: {
        filter: { name: product.name },
        update: { $setOnInsert: product },
        upsert: true,
      },
    })),
  );

  res.json({ message: 'Default products are available.' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((error, req, res, next) => {
  console.error('API request failed:', error);
  res.status(500).json({ message: 'Internal server error.' });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required. Set it in server/.env.');
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  const productCount = await Product.estimatedDocumentCount();
  if (productCount === 0) {
    await Product.insertMany(defaultProducts);
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('MongoDB connected.');
  });
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

startServer().catch(async (error) => {
  console.error('Server startup failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
