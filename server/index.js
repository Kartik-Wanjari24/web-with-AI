import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/auth.js';

const app = express();

// Middleware
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AdaptiveShield Auth Backend',
    timestamp: new Date().toISOString()
  });
});

// Mount Authentication routes
app.use('/api/auth', authRoutes);

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Unhandled internal server error' });
});

app.listen(config.port, () => {
  console.log('\n======================================================');
  console.log(`🚀 AdaptiveShield Auth Server running on port \x1b[32m${config.port}\x1b[0m`);
  console.log(`📡 Client origin: \x1b[36m${config.clientOrigin}\x1b[0m`);
  console.log(`🛡️  Ready to accept Email OTP auth requests`);
  console.log('======================================================\n');
});
