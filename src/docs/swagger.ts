import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'DeFi Data API',
    version: '1.0.0',
    description: 'API for DeFi data aggregation from Bifrost protocol',
    contact: {
      name: 'DeFi Data API Team',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: `https://api.defidata.com`,
      description: 'Production server',
    },
  ],
  components: {
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            description: 'Response data',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-20T10:30:00.000Z',
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 20,
              },
              total: {
                type: 'integer',
                example: 100,
              },
            },
          },
        },
        required: ['success', 'data', 'timestamp'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'An error occurred',
          },
          code: {
            type: 'string',
            example: 'ERROR_CODE',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-20T10:30:00.000Z',
          },
        },
        required: ['success', 'error', 'timestamp'],
      },
      TokenYield: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            example: 'vDOT',
            description: 'Token symbol',
          },
          protocol: {
            type: 'string',
            example: 'Bifrost',
            description: 'Protocol name',
          },
          network: {
            type: 'string',
            example: 'Polkadot',
            description: 'Blockchain network',
          },
          apy: {
            type: 'number',
            format: 'float',
            example: 12.5,
            description: 'Annual Percentage Yield',
          },
          apyBreakdown: {
            type: 'object',
            properties: {
              base: {
                type: 'number',
                format: 'float',
                example: 10.0,
                description: 'Base APY',
              },
              reward: {
                type: 'number',
                format: 'float',
                example: 2.5,
                description: 'Reward APY',
              },
              mev: {
                type: 'number',
                format: 'float',
                example: 0.5,
                description: 'MEV APY (optional)',
              },
              gas: {
                type: 'number',
                format: 'float',
                example: -0.5,
                description: 'Gas cost impact (optional)',
              },
            },
            required: ['base', 'reward'],
          },
          tvl: {
            type: 'number',
            format: 'float',
            example: 1000000.0,
            description: 'Total Value Locked in USD',
          },
          totalValueMinted: {
            type: 'number',
            format: 'float',
            example: 500000.0,
            description: 'Total value minted in USD',
          },
          totalIssuance: {
            type: 'number',
            format: 'float',
            example: 1000000.0,
            description: 'Total token issuance',
          },
          holders: {
            type: 'integer',
            example: 1500,
            description: 'Number of token holders',
          },
          price: {
            type: 'number',
            format: 'float',
            example: 5.25,
            description: 'Current token price in USD',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-20T10:30:00.000Z',
            description: 'Last update timestamp',
          },
        },
        required: [
          'symbol',
          'protocol',
          'network',
          'apy',
          'apyBreakdown',
          'tvl',
          'totalValueMinted',
          'totalIssuance',
          'holders',
          'price',
          'updatedAt',
        ],
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'Invalid request parameters',
              code: 'VALIDATION_ERROR',
              timestamp: '2023-10-20T10:30:00.000Z',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'Resource not found',
              code: 'NOT_FOUND',
              timestamp: '2023-10-20T10:30:00.000Z',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },
            example: {
              success: false,
              error: 'Internal server error',
              code: 'INTERNAL_ERROR',
              timestamp: '2023-10-20T10:30:00.000Z',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Yields',
      description: 'Token yield information endpoints',
    },
    {
      name: 'Health',
      description: 'API health check endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './src/routes/v1/*.ts',
    './src/controllers/*.ts',
    './src/app.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(options);