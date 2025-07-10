import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import v1Routes from './routes/v1';
import { swaggerSpec } from './docs/swagger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

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

// Swagger documentation
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DeFi Data API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'tag',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Swagger JSON endpoint
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use(`/api/${config.apiVersion}`, v1Routes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     tags: [Health]
 *     description: Returns basic API information and links to documentation
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: 'DeFi Data API'
 *                         version:
 *                           type: string
 *                           example: 'v1'
 *                         documentation:
 *                           type: string
 *                           example: '/api-docs'
 *             example:
 *               success: true
 *               data:
 *                 message: 'DeFi Data API'
 *                 version: 'v1'
 *                 documentation: '/api-docs'
 *               timestamp: '2023-10-20T10:30:00.000Z'
 */
app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      message: 'DeFi Data API',
      version: config.apiVersion,
      documentation: '/api-docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;