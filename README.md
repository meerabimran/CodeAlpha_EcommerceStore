# CodeAlpha E-commerce Store

A React storefront with an Express API and MongoDB-backed product catalog.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB locally, or a MongoDB Atlas connection string

## Configure MongoDB

Create `server/.env` from `server/.env.example` and set `MONGO_URI` to your local MongoDB URL or Atlas connection string. Keep this file private; it is ignored by Git. If your system DNS resolver blocks MongoDB Atlas SRV lookups, set `MONGO_DNS_SERVERS` to reachable comma-separated DNS server IPs. For a hosted frontend on a different origin, set `CLIENT_ORIGIN` to that frontend's origin.

The API waits for MongoDB before listening. It inserts the starter catalog by slug, so starting the server more than once does not duplicate those products. The storefront loads its product list from the MongoDB-backed `GET /api/products` endpoint; if the API is unavailable, the storefront reports the error instead of silently showing sample data. Existing database records are preserved.

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

Open the frontend at <http://localhost:5173>. Vite proxies `/api` requests to the backend at <http://localhost:5000>. If the backend uses a different local port, set `VITE_API_PROXY_TARGET` to its URL before starting Vite (for example, `http://localhost:5001`).

To build and lint the frontend:

```bash
cd client
npm run lint
npm run build
```

## Deploy the storefront to GitHub Pages

The `Deploy storefront to GitHub Pages` workflow builds and publishes the React client whenever changes are pushed to `main`, or when started manually from the Actions tab. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. After the first successful workflow run, the storefront will be available at <https://meerabimran.github.io/CodeAlpha_EcommerceStore/>.

GitHub Pages hosts only the static storefront; it does not run the Express API or MongoDB. To load products in the deployed storefront, deploy the API and database separately, then add a repository Actions variable named `VITE_API_BASE_URL` with the API's public origin (for example, `https://api.example.com`). Configure the API's `CLIENT_ORIGIN` to `https://meerabimran.github.io` so it accepts storefront requests. The storefront can still be deployed without this variable, but catalog requests will fail until an API is available.
