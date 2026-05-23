import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Mount API router
app.use('/api', apiRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Unhandled Server Error]', err);
  // Fail close & Generic error message for security
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server - strictly listening on 127.0.0.1 for local loopback test security
app.listen(Number(PORT), '127.0.0.1', () => {
  console.log(`🚀 FinTrack Backend active on http://127.0.0.1:${PORT}`);
});
