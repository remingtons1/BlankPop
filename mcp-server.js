import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Product catalog
const PRODUCTS = [
  { id: "tshirt", name: "T-Shirt", basePrice: 29, colors: ["white", "black", "navy"], sizes: ["S", "M", "L", "XL"] },
  { id: "hoodie", name: "Hoodie", basePrice: 49, colors: ["white", "black", "gray"], sizes: ["S", "M", "L", "XL"] },
  { id: "mug", name: "Ceramic Mug", basePrice: 18, colors: ["white"], sizes: ["11oz", "15oz"] },
  { id: "poster", name: "Premium Poster", basePrice: 20, colors: [], sizes: ["8x10", "12x18", "18x24"] },
];

// Create MCP server
const server = new McpServer({
  name: "BlankPop",
  version: "1.0.0",
});

// Load widget HTML
const widgetHtml = fs.readFileSync(
  path.join(__dirname, "public/widgets/product-widget.html"),
  "utf-8"
);

// Register the product widget as a resource
server.resource(
  "product-widget",
  "ui://widget/product-widget.html",
  async () => ({
    contents: [
      {
        uri: "ui://widget/product-widget.html",
        mimeType: "text/html+skybridge",
        text: widgetHtml,
        _meta: {
          "openai/widgetPrefersBorder": true,
          "openai/widgetDomain": "https://chatgpt.com",
        },
      },
    ],
  })
);

// Tool: Show available products
server.tool(
  "show_products",
  {
    title: "Show BlankPop Products",
    description: "Display available products for custom AI-designed merchandise",
    inputSchema: z.object({}),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Loading products...",
      "openai/toolInvocation/invoked": "Products ready!",
    },
  },
  async () => {
    return {
      structuredContent: {
        action: "show_products",
        products: PRODUCTS,
      },
      content: [
        {
          type: "text",
          text: "Here are the products you can customize with your AI-generated design. Choose a product to see it with your design!",
        },
      ],
    };
  }
);

// Tool: Generate a design
server.tool(
  "generate_design",
  {
    title: "Generate Design",
    description: "Generate a custom design based on user description using AI",
    inputSchema: z.object({
      prompt: z.string().describe("Description of the design to create"),
      style: z.string().optional().describe("Art style (e.g., minimalist, geometric, vintage, abstract)"),
    }),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Creating your design...",
      "openai/toolInvocation/invoked": "Design created!",
    },
  },
  async ({ prompt, style }) => {
    // TODO: Integrate with DALL-E API to generate actual images
    // For now, return a placeholder design
    const designId = `design_${Date.now()}`;
    const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

    return {
      structuredContent: {
        action: "show_design",
        design: {
          id: designId,
          prompt: fullPrompt,
          imageUrl: "https://blankpop.online/images/tshirt-white.svg", // Placeholder
          status: "generated",
        },
        products: PRODUCTS,
      },
      content: [
        {
          type: "text",
          text: `I've created a design based on: "${fullPrompt}". Select a product to see how it looks!`,
        },
      ],
    };
  }
);

// Tool: Show design on product (mockup)
server.tool(
  "show_mockup",
  {
    title: "Show Design on Product",
    description: "Display the generated design on a specific product",
    inputSchema: z.object({
      designId: z.string().describe("The design ID"),
      productId: z.string().describe("Product type (tshirt, hoodie, mug, poster)"),
      color: z.string().optional().describe("Product color"),
      size: z.string().optional().describe("Product size"),
    }),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Creating mockup...",
      "openai/toolInvocation/invoked": "Mockup ready!",
    },
  },
  async ({ designId, productId, color, size }) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return {
        content: [{ type: "text", text: "Product not found" }],
        isError: true,
      };
    }

    const selectedColor = color || product.colors[0] || "";
    const selectedSize = size || product.sizes[0];
    const imageUrl = `https://blankpop.online/images/${productId}-${selectedColor || "white"}.svg`;

    return {
      structuredContent: {
        action: "show_mockup",
        mockup: {
          designId,
          product: product.name,
          productId,
          color: selectedColor,
          size: selectedSize,
          price: product.basePrice,
          imageUrl,
        },
      },
      content: [
        {
          type: "text",
          text: `Here's your design on a ${selectedColor ? selectedColor + " " : ""}${product.name} (${selectedSize}) - $${product.basePrice}. Ready to buy?`,
        },
      ],
    };
  }
);

// Tool: Add to cart / initiate checkout
server.tool(
  "checkout",
  {
    title: "Buy Now",
    description: "Start checkout for the selected product with design",
    inputSchema: z.object({
      designId: z.string().describe("The design ID"),
      productId: z.string().describe("Product type"),
      color: z.string().optional(),
      size: z.string(),
      quantity: z.number().default(1),
    }),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Preparing checkout...",
      "openai/toolInvocation/invoked": "Ready to checkout!",
    },
  },
  async ({ designId, productId, color, size, quantity }) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return {
        content: [{ type: "text", text: "Product not found" }],
        isError: true,
      };
    }

    const total = product.basePrice * quantity;
    const checkoutSessionId = `cs_${Date.now()}`;

    return {
      structuredContent: {
        action: "checkout",
        checkout: {
          sessionId: checkoutSessionId,
          items: [
            {
              designId,
              productId,
              productName: product.name,
              color: color || product.colors[0] || "",
              size,
              quantity,
              unitPrice: product.basePrice,
              total,
            },
          ],
          subtotal: total,
          shipping: 5.99,
          total: total + 5.99,
        },
      },
      content: [
        {
          type: "text",
          text: `Ready to checkout! ${quantity}x ${product.name} (${size}) = $${total}. Shipping: $5.99. Total: $${(total + 5.99).toFixed(2)}`,
        },
      ],
    };
  }
);

// HTTP server to handle MCP requests
const PORT = process.env.PORT || 3001;

const httpServer = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/mcp" || req.url?.startsWith("/mcp")) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => `session_${Date.now()}`,
    });

    await transport.handleRequest(req, res, server);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

httpServer.listen(PORT, () => {
  console.log(`BlankPop MCP server running at http://localhost:${PORT}/mcp`);
  console.log(`Use ngrok to expose: ngrok http ${PORT}`);
});
