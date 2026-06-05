const swaggerJSDoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "PulseNode SCADA API",
    version: "1.0.0",
    description: "Industrial SCADA Control System API Documentation",
  },
  servers: [
    {
      url: process.env.SERVER_URL || "http://localhost:5000",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./routes/*.js"], // API docs inside routes
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;