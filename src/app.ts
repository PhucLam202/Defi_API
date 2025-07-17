import express,{Express} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import { apiReference } from '@scalar/express-api-reference';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { specs } from './config/swagger.config.js';
import v1Routes from './routes/v1/index.js';

const app:Express = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: false
}));

// Compression
app.use(compression());

// Request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve OpenAPI spec as JSON
app.get("/api-docs/swagger.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

// Serve Scalar API documentation
app.use('/docs', apiReference({
  spec: {
    content: specs,
  },
  hideClientButton: true,
  showSidebar: true,
  hideModels: false,
  hideSearch: false,
  hideServerSelector: true,
  hideTryIt: false
}));

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "API Server is running!",
    documentation: `${req.protocol}://${req.get("host")}/docs`,
  });
});

// API Routes
app.use('/api/v1', v1Routes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;