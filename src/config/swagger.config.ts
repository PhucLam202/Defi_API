import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DeFi Data API",
      version: "1.0.0",
      description: "DeFi Data Aggregation API with interactive documentation",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
  },
  apis: ["./src/routes/**/*.ts", "./src/controllers/**/*.ts"],
};

export const specs = swaggerJSDoc(options);
