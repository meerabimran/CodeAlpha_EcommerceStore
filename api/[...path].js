import app, { connectDatabase } from '../server/server.js';

export default async function handler(request, response) {
  try {
    await connectDatabase();
    app(request, response);
  } catch (error) {
    console.error('API startup failed:', error);
    response.status(500).json({ message: 'API unavailable.' });
  }
}
