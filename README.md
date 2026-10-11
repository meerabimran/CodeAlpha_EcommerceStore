# CodeAlpha E-commerce Store

A React storefront with an Express API and MongoDB-backed product catalog.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB locally, or a MongoDB Atlas connection string

## Configure MongoDB

Create `server/.env` from `server/.env.example` and set `MONGO_URI` to your local MongoDB URL or Atlas connection string. Keep this file private; it is ignored by Git. For a hosted frontend on a different origin, set `CLIENT_ORIGIN` to that frontend's origin.

The API waits for MongoDB before listening. On an empty database it inserts the sample products once. The `GET /api/products` endpoint serves the catalog.

## Run locally

In one terminal:

```bash
cd server
npm install
npm run dev
```

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the frontend at <http://localhost:5173>. Vite proxies `/api` requests to the backend at <http://localhost:5000>.

To build and lint the frontend:

```bash
cd client
npm run lint
npm run build
```
