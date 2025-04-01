import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mainstack - ASSESSMENT',
      version: '1.0.0',
      description: 'A RESTful API for Banking transactions with role-based authentication',
      contact: {
        name: 'Oluwatobiloba Aremu',
        url: 'https://github.com/oluwatobiiloba/mainstack-senior-assessment',
        email: 'oluwatobiloba.f.a@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://mainstack-assessment.onrender.com',
        description: 'Live API Deployed on render'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Transaction: {
          type: 'object',
          required: ['name', 'description', 'price', 'stock', 'sku'],
          properties: {
            id: {
              type: 'string',
              description: 'The auto-generated id of the transaction',
            },
            name: {
              type: 'string',
              description: 'The name of the transaction',
            },
            description: {
              type: 'string',
              description: 'The description of the transaction',
            },
            price: {
              type: 'number',
              description: 'The price of the transaction',
              minimum: 0,
            },
            stock: {
              type: 'integer',
              description: 'The available stock of the transaction',
              minimum: 0,
            },
            sku: {
              type: 'string',
              description: 'The unique SKU of the transaction',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
            },
            message: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);