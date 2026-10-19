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

## Deploy the full stack to Vercel

Vercel serves the React storefront and the Express API from the same deployment. MongoDB must still be hosted separately; a local MongoDB instance is not reachable from Vercel.

1. Import this GitHub repository in Vercel and set **Root Directory** to the repository root (`.`). Do not set it to `client`: the Vercel function and `vercel.json` are at the repository root, alongside `client/` and `server/`.
2. In **Project Settings → Build and Deployment**, use the settings from the root `vercel.json`: install command `npm install --prefix client && npm install --prefix server`, build command `npm run build --prefix client`, and output directory `client/dist`. These commands are relative to the repository root.
3. In **Project Settings → Environment Variables**, add `MONGO_URI` for Production (and Preview too, if previews should load products). Use a MongoDB Atlas or other remotely reachable connection string; never use `mongodb://127.0.0.1` or `mongodb://localhost` on Vercel. Ensure the database user and network access settings allow Vercel to connect.
4. Optionally add `MONGO_DNS_SERVERS` only if your database hostname requires custom DNS resolvers.
5. Deploy, then check the deployment's `/` page and `/api/products` endpoint.

The Vercel serverless API is in `api/[...path].js`; the Vite build serves the client, and `vercel.json` sends application routes to the SPA while preserving API routes. Because the storefront and API share an origin, no `VITE_API_BASE_URL` or `CLIENT_ORIGIN` setting is needed.

### Vercel troubleshooting

- **Install fails with a path like `/vercel/path0/client/client/package.json`:** Vercel's **Root Directory** is `client`, while the install command prefixes `client` relative to the repository root. Set **Root Directory** to `.`. Do not remove the prefix from the command: the project also needs to install the server dependencies and include the root-level API function.
- **Vercel logs a commit older than the latest deployment config:** trigger a new deployment from the latest `main` commit after correcting the Root Directory. The deployment log should use the current `main` commit.
- **Build fails before deployment:** confirm the Vercel Root Directory is `.` and the Node.js version is 22 or newer. The client uses Vite 8, which requires a recent Node.js release.
- **`/` works but `/api/products` returns `500`:** add `MONGO_URI` to the environment for the deployment's environment, then redeploy. Check Vercel Function logs for the database connection error.
- **MongoDB connection times out:** check that the URI is correct, the database user has access, and the database network access rules permit connections from Vercel.
- **`/api/products` returns `404`:** ensure the deployment includes the root `api/[...path].js` function and uses the repository root as its Vercel Root Directory.
- **A change to environment variables has no effect:** trigger a new deployment; environment changes apply to new deployments.

## Deploy the storefront to GitHub Pages (optional)

The `Deploy storefront to GitHub Pages` workflow builds and publishes only the React client when changes are pushed to `main`, or when started manually from the Actions tab. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. After a successful workflow run, the storefront is available at <https://meerabimran.github.io/CodeAlpha_EcommerceStore/>.

GitHub Pages does not run the Express API or MongoDB. To load products there, deploy the API separately, add a repository Actions variable named `VITE_API_BASE_URL` with the API's public origin, and configure that API's `CLIENT_ORIGIN` to `https://meerabimran.github.io`.
