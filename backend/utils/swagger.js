// utils/swagger.js
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your Project API Docs",
      version: "1.0.0",
      description: "Auto-generated API documentation for your Express backend",
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
    ],
  },
  // Path to your route files (update if needed)
  apis: ["./routes/*.js", "./controllers/*.js"],
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };
