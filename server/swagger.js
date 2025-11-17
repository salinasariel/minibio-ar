const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'MiniBio API',
      version: '1.0.0',
      description: 'Documentación oficial de la API para el proyecto MiniBio',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de Desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use(
    '/api-docs', 
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
  console.log('Swagger UI corriendo en /api-docs');
};

module.exports = setupSwagger;