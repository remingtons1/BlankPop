import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// In-memory store for generated designs
const designStore = new Map();

// Product catalog
const PRODUCTS = [
  { id: "tshirt", name: "T-Shirt", basePrice: 29, colors: ["white", "black", "navy"], sizes: ["S", "M", "L", "XL"] },
  { id: "hoodie", name: "Hoodie", basePrice: 49, colors: ["white", "black", "gray"], sizes: ["S", "M", "L", "XL"] },
  { id: "mug", name: "Ceramic Mug", basePrice: 18, colors: ["white"], sizes: ["11oz", "15oz"] },
  { id: "poster", name: "Premium Poster", basePrice: 20, colors: [], sizes: ["8x10", "12x18", "18x24"] },
];

// Ensure designs directory exists
const designsDir = path.join(__dirname, "public/designs");
if (!fs.existsSync(designsDir)) {
  fs.mkdirSync(designsDir, { recursive: true });
}

// Helper function to download image from URL
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve(filepath);
      });
    }).on("error", (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Generate design with DALL-E 3
async function generateDesignWithDALLE(prompt, style) {
  const designId = `design_${Date.now()}`;

  // Enhance prompt for merchandise design
  const enhancedPrompt = `Create a SINGLE design artwork suitable for printing on a t-shirt or merchandise.
Requirements:
- ONE design only, centered in the image
- Clean solid background (white, black, or transparent-friendly)
- Bold, high-contrast artwork that prints well
- No mockups, no product images, no phone screens, no multiple variations
- Just the artwork itself, isolated and centered

Design request: ${prompt}${style ? `, in ${style} style` : ""}.`;

  try {
    console.log(`Generating design with DALL-E 3: "${prompt}"`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    // Download and save the image locally
    const filename = `${designId}.png`;
    const filepath = path.join(designsDir, filename);
    await downloadImage(imageUrl, filepath);

    // Store design info
    const design = {
      id: designId,
      prompt: prompt,
      style: style || null,
      revisedPrompt: revisedPrompt,
      originalUrl: imageUrl,
      localPath: `/designs/${filename}`,
      createdAt: new Date().toISOString(),
    };

    designStore.set(designId, design);
    console.log(`Design saved: ${designId}`);

    return design;
  } catch (error) {
    console.error("DALL-E generation error:", error.message);
    throw error;
  }
}

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
server.registerTool(
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

// Tool: Generate a design with DALL-E 3
server.registerTool(
  "generate_design",
  {
    title: "Generate Design",
    description: "Generate a custom design using DALL-E 3 AI based on user description",
    inputSchema: z.object({
      prompt: z.string().describe("Description of the design to create (e.g., 'a cosmic cat floating in space', 'minimalist mountain sunset')"),
      style: z.string().optional().describe("Art style (e.g., minimalist, geometric, vintage, abstract, watercolor, retro, cyberpunk)"),
    }),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Creating your design with DALL-E 3...",
      "openai/toolInvocation/invoked": "Design created!",
    },
  },
  async (params) => {
    // Handle wrapped params (ChatGPT may send {inputSchema: {...}})
    const { prompt, style } = params.inputSchema || params;
    console.log(`generate_design called with: prompt="${prompt}", style="${style}"`);

    try {
      const design = await generateDesignWithDALLE(prompt, style);

      // Get the base URL from environment or use localhost
      const baseUrl = process.env.BASE_URL || "http://localhost:3001";
      const designImageUrl = `${baseUrl}${design.localPath}`;

      return {
        structuredContent: {
          action: "show_design",
          design: {
            id: design.id,
            prompt: design.prompt,
            style: design.style,
            imageUrl: designImageUrl,
            status: "generated",
          },
          products: PRODUCTS,
        },
        content: [
          {
            type: "text",
            text: `I've created your design based on: "${prompt}"${style ? ` in ${style} style` : ""}. The AI has generated a unique image for your merchandise. Select a product below to see how it looks!`,
          },
        ],
      };
    } catch (error) {
      // Fallback to placeholder if DALL-E fails
      const designId = `design_${Date.now()}`;
      return {
        structuredContent: {
          action: "show_design",
          design: {
            id: designId,
            prompt: prompt,
            style: style,
            imageUrl: "https://blankpop.online/images/tshirt-white.svg",
            status: "placeholder",
            error: error.message,
          },
          products: PRODUCTS,
        },
        content: [
          {
            type: "text",
            text: `I encountered an issue generating your design: ${error.message}. Please make sure the OPENAI_API_KEY is set. Showing placeholder for now.`,
          },
        ],
      };
    }
  }
);

// Tool: Show design on product (mockup)
server.registerTool(
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
  async (params) => {
    // Handle wrapped params
    const { designId, productId, color, size } = params.inputSchema || params;
    console.log(`show_mockup called with: designId="${designId}", productId="${productId}"`);

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return {
        content: [{ type: "text", text: "Product not found" }],
        isError: true,
      };
    }

    const selectedColor = color || product.colors[0] || "";
    const selectedSize = size || product.sizes[0];

    // Get the design from store
    const design = designStore.get(designId);
    const baseUrl = process.env.BASE_URL || "http://localhost:3001";

    // Product mockup image (blank product)
    const productImageUrl = `https://blankpop.online/images/${productId}-${selectedColor || "white"}.svg`;

    // Design image (the generated design)
    const designImageUrl = design
      ? `${baseUrl}${design.localPath}`
      : null;

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
          productImageUrl,
          designImageUrl,
          hasDesign: !!design,
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
server.registerTool(
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
  async (params) => {
    // Handle wrapped params
    const { designId, productId, color, size, quantity = 1 } = params.inputSchema || params;
    console.log(`checkout called with: designId="${designId}", productId="${productId}", size="${size}"`);

    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return {
        content: [{ type: "text", text: "Product not found" }],
        isError: true,
      };
    }

    const design = designStore.get(designId);
    const baseUrl = process.env.BASE_URL || "http://localhost:3001";
    const total = product.basePrice * quantity;
    const selectedColor = color || product.colors[0] || "";

    // Create Stripe Checkout Session
    let checkoutUrl = null;
    let checkoutSessionId = `cs_${Date.now()}`;

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${product.name} - ${selectedColor} (${size})`,
                  description: design ? `Custom design: ${design.prompt}` : "BlankPop custom merchandise",
                  images: design ? [`${baseUrl}${design.localPath}`] : [],
                },
                unit_amount: Math.round(product.basePrice * 100), // Stripe uses cents
              },
              quantity: quantity,
            },
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Shipping",
                },
                unit_amount: 599, // $5.99 in cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/checkout/cancel`,
          metadata: {
            designId: designId,
            productId: productId,
            color: selectedColor,
            size: size,
          },
        });

        checkoutUrl = session.url;
        checkoutSessionId = session.id;
        console.log(`Stripe session created: ${session.id}`);
      } catch (error) {
        console.error("Stripe error:", error.message);
      }
    }

    return {
      structuredContent: {
        action: "checkout",
        checkout: {
          sessionId: checkoutSessionId,
          checkoutUrl: checkoutUrl,
          items: [
            {
              designId,
              productId,
              productName: product.name,
              color: selectedColor,
              size,
              quantity,
              unitPrice: product.basePrice,
              total,
              designImageUrl: design ? `${baseUrl}${design.localPath}` : null,
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
          text: checkoutUrl
            ? `Ready to checkout! ${quantity}x ${product.name} (${size}) = $${total}. Shipping: $5.99. Total: $${(total + 5.99).toFixed(2)}. Click "Complete Purchase" to pay securely with Stripe.`
            : `Ready to checkout! ${quantity}x ${product.name} (${size}) = $${total}. Shipping: $5.99. Total: $${(total + 5.99).toFixed(2)}`,
        },
      ],
    };
  }
);

// HTTP server to handle MCP requests and serve static files
const PORT = process.env.PORT || 3001;

// Store transports for session management
const transports = new Map();

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static files from /designs/
  if (req.url?.startsWith("/designs/")) {
    const filename = req.url.replace("/designs/", "");
    const filepath = path.join(designsDir, filename);

    if (fs.existsSync(filepath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
      };

      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(filepath).pipe(res);
      return;
    } else {
      res.writeHead(404);
      res.end("Design not found");
      return;
    }
  }

  // Serve static files from /images/
  if (req.url?.startsWith("/images/")) {
    const filename = req.url.replace("/images/", "");
    const filepath = path.join(__dirname, "public/images", filename);

    if (fs.existsSync(filepath)) {
      const ext = path.extname(filename).toLowerCase();
      const mimeTypes = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
      };

      res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(filepath).pipe(res);
      return;
    } else {
      res.writeHead(404);
      res.end("Image not found");
      return;
    }
  }

  // SSE endpoint - establish SSE connection
  if (url.pathname === "/mcp" && req.method === "GET") {
    console.log("  -> SSE connection request");

    // Add headers to prevent proxy buffering (cloudflare, nginx, etc)
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");

    const transport = new SSEServerTransport("/mcp/messages", res);

    // The transport generates its own session ID - we need to capture it
    // Access the private _sessionId (it's sent in the endpoint event)
    const sessionId = transport._sessionId;
    console.log(`  -> Created session: ${sessionId}`);

    transports.set(sessionId, transport);

    // Clean up on close
    transport.onclose = () => {
      console.log(`  -> Session closed: ${sessionId}`);
      transports.delete(sessionId);
    };

    transport.onerror = (error) => {
      console.error(`  -> Session error: ${sessionId}`, error);
      transports.delete(sessionId);
    };

    // Connect the transport to the MCP server
    try {
      await server.connect(transport);
    } catch (error) {
      console.error("  -> Error connecting to MCP server:", error);
    }
    // Transport sends its own endpoint event automatically
    return;
  }

  // Message endpoint - handle MCP messages
  if (url.pathname === "/mcp/messages" && req.method === "POST") {
    const sessionId = url.searchParams.get("sessionId");
    console.log(`  -> Message for session: ${sessionId}`);

    if (!sessionId || !transports.has(sessionId)) {
      console.log("  -> Session not found");
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid or missing session ID" }));
      return;
    }

    const transport = transports.get(sessionId);
    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("  -> Error handling message:", error);
    }
    return;
  }

  // Handle POST /mcp for Streamable HTTP transport (newer format)
  if (url.pathname === "/mcp" && req.method === "POST") {
    console.log("  -> POST to /mcp (Streamable HTTP)");

    try {
      // Create a new transport for each request (stateless)
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      });

      // Handle the request - pass server for initialization
      await transport.handleRequest(req, res, server);
    } catch (error) {
      console.error("  -> Streamable HTTP error:", error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    }
    return;
  }

  // Serve static files from Next.js build (out directory)
  const staticDir = path.join(__dirname, "out");
  let filePath = path.join(staticDir, url.pathname);

  // Handle directory requests (serve index.html)
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // Try with .html extension if file doesn't exist
  if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    filePath = filePath + ".html";
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
    };

    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Fallback 404
  res.writeHead(404);
  res.end("Not found");
});

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    BlankPop MCP Server                       ║
╠══════════════════════════════════════════════════════════════╣
║  SSE Endpoint: http://localhost:${PORT}/mcp                     ║
║  Message Endpoint: http://localhost:${PORT}/mcp/messages        ║
║  Designs served from: /designs/                              ║
╠══════════════════════════════════════════════════════════════╣
║  To test with ChatGPT:                                       ║
║  1. Run: ngrok http ${PORT}                                     ║
║  2. Add connector in ChatGPT with ngrok URL + /mcp           ║
╠══════════════════════════════════════════════════════════════╣
║  Environment:                                                ║
║  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✓ Set" : "✗ Not set (DALL-E won't work)"}                              ║
║  BASE_URL: ${process.env.BASE_URL || "http://localhost:" + PORT}                        ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
