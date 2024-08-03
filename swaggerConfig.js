const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Casa de Salud API',
            version: '1.0.0',
            description: 'API para la recolección de datos de una Casa de Salud',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./server.js'], // Aquí es donde Swagger buscará las anotaciones de la API
};

const specs = swaggerJsDoc(options);

module.exports = {
    swaggerUi,
    specs,
};
