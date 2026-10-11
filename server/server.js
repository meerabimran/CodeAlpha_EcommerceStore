import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import dns from 'node:dns';
import mongoose from 'mongoose';
import defaultProducts from './data/products.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const productSchema = new mongoose.Schema({
  slug: { type: String, trim: true, unique: true, sparse: true },
  name: { type: String, required: true, trim: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String },
  category: { type: String, required: true, trim: true },
  rating: { type: Number, min: 0, max: 5, default: 4.8 },
  stock: { type: Number, min: 0, default: 1 },
  badge: { type: String, default: '' },
  tone: { type: String, default: 'sage' },
  icon: { type: String, default: '✳' },
  description: { type: String, default: '' },
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
    defaultProducts.map(({ id: slug, ...product }) => ({
      updateOne: {
        filter: { slug },
        update: { $setOnInsert: { ...product, slug } },
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

  const dnsServers = process.env.MONGO_DNS_SERVERS
    ?.split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers?.length) {
    dns.setServers(dnsServers);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });

  await Product.bulkWrite(
    defaultProducts.map(({ id: slug, ...product }) => ({
      updateOne: {
        filter: { slug },
        update: { $setOnInsert: { ...product, slug } },
        upsert: true,
      },
    })),
  );

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
