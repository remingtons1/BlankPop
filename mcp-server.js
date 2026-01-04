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

// Printful API configuration
// Fallback to hardcoded key if env var not set (Railway env var issue workaround)
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY || "UxhlP1zoJfn8mZglOwamJXtX0U8TGA1XP3yATYWr";
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID || "12456551";
const PRINTFUL_API_URL = "https://api.printful.com";

// Printful product mapping
const PRINTFUL_PRODUCTS = {
  tshirt: {
    productId: 71,
    name: "Unisex Staple T-Shirt | Bella + Canvas 3001",
    variants: {
      white: { S: 4011, M: 4012, L: 4013, XL: 4014, "2XL": 4015 },
      black: { S: 4016, M: 4017, L: 4018, XL: 4019, "2XL": 4020 },
      navy: { S: 4111, M: 4112, L: 4113, XL: 4114, "2XL": 4115 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      // Centered design position
      position: { width: 1200, height: 1200, top: 200, left: 300 }
    },
  },
  hoodie: {
    productId: 146,
    name: "Unisex Heavy Blend Hoodie | Gildan 18500",
    variants: {
      white: { S: 5522, M: 5523, L: 5524, XL: 5525, "2XL": 5526 },
      black: { S: 5530, M: 5531, L: 5532, XL: 5533, "2XL": 5534 },
      gray: { S: 5610, M: 5611, L: 5612, XL: 5613, "2XL": 5614 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      position: { width: 1100, height: 1100, top: 250, left: 350 }
    },
  },
  mug: {
    productId: 19,
    name: "White Glossy Mug",
    variants: {
      white: { "11oz": 1320, "15oz": 4830 },
    },
    printfile: {
      width: 2700,
      height: 1050,
      placement: "default",
      // Center the design on the wrap-around print area
      position: { width: 900, height: 900, top: 75, left: 900 }
    },
  },
  poster: {
    productId: 1,
    name: "Enhanced Matte Paper Poster",
    variants: {
      default: { "8x10": 4463, "12x18": 3876, "18x24": 1 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "default",
      position: { width: 1600, height: 1600, top: 100, left: 100 }
    },
  },
  // Bestseller additions
  comfort_tee: {
    productId: 586,
    name: "Heavyweight T-Shirt | Comfort Colors 1717",
    variants: {
      ivory: { S: 16523, M: 16524, L: 16525, XL: 16526, "2XL": 16527 },
      black: { S: 15114, M: 15115, L: 15116, XL: 15117, "2XL": 15118 },
      "blue jean": { S: 16511, M: 16512, L: 16513, XL: 16514, "2XL": 16515 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      position: { width: 1200, height: 1200, top: 200, left: 300 }
    },
  },
  champion_hoodie: {
    productId: 842,
    name: "Champion Hoodie",
    variants: {
      black: { S: 22299, M: 22301, L: 22303, XL: 22305, "2XL": 22307 },
      "light steel": { S: 22300, M: 22302, L: 22304, XL: 22306, "2XL": 22308 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      position: { width: 1100, height: 1100, top: 250, left: 350 }
    },
  },
  tank: {
    productId: 248,
    name: "Tank Top | Bella + Canvas 3480",
    variants: {
      white: { S: 8659, M: 8660, L: 8661, XL: 8662, "2XL": 8663 },
      black: { S: 8629, M: 8630, L: 8631, XL: 8632, "2XL": 8633 },
      heather: { S: 8635, M: 8636, L: 8637, XL: 8638, "2XL": 8639 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      position: { width: 1000, height: 1000, top: 150, left: 400 }
    },
  },
  sweatshirt: {
    productId: 145,
    name: "Crewneck Sweatshirt | Gildan 18000",
    variants: {
      white: { S: 5426, M: 5427, L: 5428, XL: 5429, "2XL": 5430 },
      black: { S: 5434, M: 5435, L: 5436, XL: 5437, "2XL": 5438 },
      gray: { S: 5514, M: 5515, L: 5516, XL: 5517, "2XL": 5518 },
    },
    printfile: {
      width: 1800,
      height: 2400,
      placement: "front",
      position: { width: 1100, height: 1100, top: 250, left: 350 }
    },
  },
};

// In-memory store for generated designs
const designStore = new Map();

// Store for Stripe checkout sessions (for short URL redirect)
const checkoutSessions = new Map();

// Cache for generated mockups (designId-productId-color -> mockupUrl)
const mockupCache = new Map();

// Product catalog
const PRODUCTS = [
  { id: "tshirt", name: "T-Shirt", basePrice: 29, colors: ["white", "black", "navy"], sizes: ["S", "M", "L", "XL"] },
  { id: "hoodie", name: "Hoodie", basePrice: 49, colors: ["white", "black", "gray"], sizes: ["S", "M", "L", "XL"] },
  { id: "mug", name: "Ceramic Mug", basePrice: 18, colors: ["white"], sizes: ["11oz", "15oz"] },
  { id: "poster", name: "Premium Poster", basePrice: 20, colors: [], sizes: ["8x10", "12x18", "18x24"] },
  // Bestsellers
  { id: "comfort_tee", name: "Heavyweight Tee", basePrice: 32, colors: ["ivory", "black", "blue jean"], sizes: ["S", "M", "L", "XL"] },
  { id: "champion_hoodie", name: "Champion Hoodie", basePrice: 59, colors: ["black", "light steel"], sizes: ["S", "M", "L", "XL"] },
  { id: "tank", name: "Tank Top", basePrice: 25, colors: ["white", "black", "heather"], sizes: ["S", "M", "L", "XL"] },
  { id: "sweatshirt", name: "Crewneck", basePrice: 39, colors: ["white", "black", "gray"], sizes: ["S", "M", "L", "XL"] },
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

// Generate mockup using Printful API
async function generatePrintfulMockup(designImageUrl, productId, color, size) {
  if (!PRINTFUL_API_KEY) {
    console.log("Printful API key not set, skipping mockup generation");
    return { error: "PRINTFUL_API_KEY not configured" };
  }

  const printfulProduct = PRINTFUL_PRODUCTS[productId];
  if (!printfulProduct) {
    console.log(`No Printful mapping for product: ${productId}`);
    return { error: `No Printful mapping for product: ${productId}` };
  }

  // Get the variant ID for the color/size combination
  const colorKey = color || Object.keys(printfulProduct.variants)[0];
  const sizeKey = size || Object.keys(printfulProduct.variants[colorKey] || {})[0];
  const variantId = printfulProduct.variants[colorKey]?.[sizeKey];

  if (!variantId) {
    console.log(`No variant found for ${productId} ${colorKey} ${sizeKey}`);
    return { error: `No variant found for ${productId} ${colorKey} ${sizeKey}` };
  }

  // Check cache first
  const cacheKey = `${designImageUrl}-${productId}-${colorKey}`;
  if (mockupCache.has(cacheKey)) {
    console.log(`Using cached mockup for ${cacheKey}`);
    return mockupCache.get(cacheKey);
  }

  const { width, height, placement, position } = printfulProduct.printfile;

  try {
    console.log(`Generating Printful mockup for ${productId} (variant ${variantId})...`);

    // Create mockup generation task
    const createResponse = await fetch(
      `${PRINTFUL_API_URL}/mockup-generator/create-task/${printfulProduct.productId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTFUL_API_KEY}`,
          "Content-Type": "application/json",
          "X-PF-Store-Id": PRINTFUL_STORE_ID,
        },
        body: JSON.stringify({
          variant_ids: [variantId],
          format: "jpg",
          files: [
            {
              placement: placement,
              image_url: designImageUrl,
              position: {
                area_width: width,
                area_height: height,
                width: position?.width || width,
                height: position?.height || height,
                top: position?.top || 0,
                left: position?.left || 0,
              },
            },
          ],
        }),
      }
    );

    const createData = await createResponse.json();
    if (createData.code !== 200) {
      console.error("Printful create task error:", createData);
      return { error: `Printful API error: ${createData.error?.message || createData.result?.error || JSON.stringify(createData)}` };
    }

    const taskKey = createData.result.task_key;
    console.log(`Mockup task created: ${taskKey}`);

    // Poll for completion (max 30 seconds)
    let attempts = 0;
    while (attempts < 15) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await fetch(
        `${PRINTFUL_API_URL}/mockup-generator/task?task_key=${taskKey}`,
        {
          headers: {
            Authorization: `Bearer ${PRINTFUL_API_KEY}`,
            "X-PF-Store-Id": PRINTFUL_STORE_ID,
          },
        }
      );

      const statusData = await statusResponse.json();

      if (statusData.result.status === "completed") {
        let mockupUrl = statusData.result.mockups?.[0]?.mockup_url;
        const extras = statusData.result.mockups?.[0]?.extra || [];

        // For mugs, prefer "Front view" from extras
        if (productId === "mug") {
          const frontView = extras.find(e => e.option === "Front view" || e.title === "Front view");
          if (frontView?.url) {
            mockupUrl = frontView.url;
            console.log(`Using mug front view: ${mockupUrl}`);
          }
        } else {
          // For apparel, prefer lifestyle/model shots if available
          const lifestyleOptions = ["On model", "Lifestyle", "Model", "Front"];
          for (const option of lifestyleOptions) {
            const lifestyle = extras.find(e =>
              (e.option && e.option.includes(option)) ||
              (e.title && e.title.includes(option))
            );
            if (lifestyle?.url) {
              mockupUrl = lifestyle.url;
              console.log(`Using lifestyle mockup (${option}): ${mockupUrl}`);
              break;
            }
          }
        }

        console.log(`Mockup completed: ${mockupUrl}`);

        // Cache the result
        if (mockupUrl) {
          mockupCache.set(cacheKey, {
            mockupUrl,
            allMockups: statusData.result.mockups,
          });
        }

        return {
          mockupUrl,
          allMockups: statusData.result.mockups,
        };
      } else if (statusData.result.status === "failed") {
        console.error("Mockup generation failed:", statusData);
        return { error: `Printful mockup failed: ${statusData.result.error || 'Unknown error'}` };
      }

      attempts++;
    }

    console.log("Mockup generation timed out");
    return { error: "Mockup generation timed out" };
  } catch (error) {
    console.error("Printful mockup error:", error.message);
    return { error: `Printful error: ${error.message}` };
  }
}

// Generate design with DALL-E 3
async function generateDesignWithDALLE(prompt, style) {
  const designId = `design_${Date.now()}`;

  // Clean prompt: remove product-related words that cause DALL-E to render mockups
  const cleanedPrompt = prompt
    .replace(/\b(t-?shirt|shirt|mug|cup|hoodie|sweatshirt|hat|cap|tote|bag|poster|print|merch|merchandise|product|apparel)\s*(design|graphic|art)?\b/gi, '')
    .replace(/\bdesign\s+(for|on)\s+(a\s+)?(t-?shirt|shirt|mug|hoodie|hat|product)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  console.log(`Original prompt: "${prompt}"`);
  console.log(`Cleaned prompt: "${cleanedPrompt}"`);

  // Enhance prompt for merch-ready design using print-design best practices
  const styleMap = {
    'vintage': 'retro vintage style, textured print, distressed ink, warm muted colors',
    'retro': 'retro vintage style, textured print, distressed ink, warm muted colors',
    'minimal': 'minimalist graphic, flat monochrome vector, thick bold outline',
    'minimalist': 'minimalist graphic, flat monochrome vector, thick bold outline',
    'cute': 'kawaii cute style, soft chibi proportions, pastel limited palette, rounded shapes, sticker-style',
    'kawaii': 'kawaii cute style, soft chibi proportions, pastel limited palette, rounded shapes, sticker-style',
    'streetwear': 'streetwear graphic, edgy bold vector illustration, high contrast, thick outlines',
    'bold': 'streetwear graphic, edgy bold vector illustration, high contrast, thick outlines',
  };

  const stylePrompt = style ? (styleMap[style.toLowerCase()] || `${style} style`) : 'clean vector illustration';

  const enhancedPrompt = `${cleanedPrompt}, ${stylePrompt}, centered composition, strong contrast, sharp clean edges, crisp silhouette, print ready artwork.

CRITICAL REQUIREMENTS - MUST FOLLOW ALL:
- ONLY the main subject/character floating on a pure solid white background
- NO color palette, NO color swatches, NO color bars
- NO text, NO labels, NO watermarks, NO signatures
- NO decorative elements, NO doodles, NO icons around it
- NO patterns, NO background details, NO gradients
- NO frame, NO border, NO margins, NO presentation mockup
- Just the single isolated design element centered, nothing else
- Do NOT show this on any product`;

  try {
    console.log(`Generating design with DALL-E 3 (cleaned): "${cleanedPrompt}"`);

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
    description: "Display the generated design on a specific product with realistic mockup",
    inputSchema: z.object({
      designId: z.string().describe("The design ID"),
      productId: z.string().describe("Product type (tshirt, hoodie, mug, poster)"),
      color: z.string().optional().describe("Product color"),
      size: z.string().optional().describe("Product size"),
    }),
    _meta: {
      "openai/outputTemplate": "ui://widget/product-widget.html",
      "openai/toolInvocation/invoking": "Generating realistic product mockup...",
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

    // Design image URL (the generated design)
    const designImageUrl = design ? `${baseUrl}${design.localPath}` : null;

    // Try to generate realistic mockup with Printful (with timeout)
    let realisticMockupUrl = null;
    let allMockupViews = null;

    if (designImageUrl && PRINTFUL_API_KEY) {
      try {
        // Set a 15-second timeout for Printful
        const mockupPromise = generatePrintfulMockup(
          designImageUrl,
          productId,
          selectedColor,
          selectedSize
        );
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Printful timeout")), 15000)
        );

        const mockupResult = await Promise.race([mockupPromise, timeoutPromise]);

        if (mockupResult?.mockupUrl) {
          realisticMockupUrl = mockupResult.mockupUrl;
          allMockupViews = mockupResult.allMockups?.[0]?.extra || [];
        } else if (mockupResult?.error) {
          console.log(`Printful mockup error: ${mockupResult.error}`);
        }
      } catch (error) {
        console.log(`Printful mockup skipped: ${error.message}`);
      }
    }

    // Fallback to SVG mockup if Printful fails
    const productImageUrl = realisticMockupUrl ||
      `https://blankpop.online/images/${productId}-${selectedColor || "white"}.svg`;

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
          realisticMockupUrl,
          allMockupViews,
          hasDesign: !!design,
          isRealisticMockup: !!realisticMockupUrl,
          availableColors: product.colors,
          availableSizes: product.sizes,
        },
      },
      content: [
        {
          type: "text",
          text: `Here's your design on a ${selectedColor ? selectedColor + " " : ""}${product.name} (${selectedSize}) - $${product.basePrice}. ${realisticMockupUrl ? "This is a realistic product preview!" : ""} Choose your color and size, then click Buy Now!`,
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
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"],
          },
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
    const filename = req.url.replace("/designs/", "").split("?")[0]; // Strip query params
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
      res.setHeader("Cache-Control", "public, max-age=300");
      fs.createReadStream(filepath).pipe(res);
      return;
    } else {
      res.writeHead(404);
      res.end("Design not found");
      return;
    }
  }

  // Health check endpoint
  if (url.pathname === "/api/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      printfulConfigured: !!PRINTFUL_API_KEY,
      stripeConfigured: !!stripe,
      openaiConfigured: !!process.env.OPENAI_API_KEY,
    }));
    return;
  }

  // API endpoint for generating Printful mockups
  if (url.pathname === "/api/mockup" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { designImageUrl, productId, color, size } = JSON.parse(body);
        console.log(`API mockup request: ${productId} ${color} ${size}`);

        if (!designImageUrl) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "designImageUrl required" }));
          return;
        }

        const mockupResult = await generatePrintfulMockup(designImageUrl, productId, color, size);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: !!mockupResult?.mockupUrl,
          mockupUrl: mockupResult?.mockupUrl || null,
          allMockups: mockupResult?.allMockups || null,
          error: mockupResult?.error || null,
        }));
      } catch (error) {
        console.error("API mockup error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // API endpoint for creating checkout session
  if (url.pathname === "/api/checkout" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const { designId, productId, color, size, quantity = 1, designImageUrl } = JSON.parse(body);
        console.log(`API checkout request: ${productId} ${color} ${size}`);

        const product = PRODUCTS.find((p) => p.id === productId);
        if (!product) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Product not found" }));
          return;
        }

        const baseUrl = process.env.BASE_URL || "https://blankpop.online";
        const selectedColor = color || product.colors[0] || "";
        const total = product.basePrice * quantity;

        if (!stripe) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Stripe not configured" }));
          return;
        }

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${product.name} - ${selectedColor} (${size})`,
                  description: "BlankPop custom AI-designed merchandise",
                  images: designImageUrl ? [designImageUrl] : [],
                },
                unit_amount: Math.round(product.basePrice * 100),
              },
              quantity: quantity,
            },
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Shipping",
                },
                unit_amount: 599,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          shipping_address_collection: {
            allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "ES", "IT", "NL", "SE", "NO", "DK", "FI"],
          },
          success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/checkout/cancel`,
          metadata: {
            designId: designId || "unknown",
            productId: productId,
            color: selectedColor,
            size: size,
          },
        });

        console.log(`Stripe session created: ${session.id}`);

        // Store session for redirect lookup (expires in 24h)
        checkoutSessions.set(session.id, {
          url: session.url,
          createdAt: Date.now(),
        });

        // Return short redirect URL instead of long Stripe URL
        const shortUrl = `${baseUrl}/pay/${session.id}`;

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          success: true,
          checkoutUrl: shortUrl,
          sessionId: session.id,
          total: total + 5.99,
        }));
      } catch (error) {
        console.error("API checkout error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }

  // Short URL redirect for Stripe checkout
  if (url.pathname.startsWith("/pay/")) {
    const sessionId = url.pathname.replace("/pay/", "");
    const session = checkoutSessions.get(sessionId);

    if (session && session.url) {
      // Clean up old sessions (older than 24h)
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      for (const [id, data] of checkoutSessions) {
        if (data.createdAt < dayAgo) checkoutSessions.delete(id);
      }

      // Redirect to Stripe
      res.writeHead(302, { Location: session.url });
      res.end();
      return;
    } else {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>Checkout session not found or expired</h1><p>Please try again.</p>");
      return;
    }
  }

  // Serve static files from /images/
  if (req.url?.startsWith("/images/")) {
    const filename = req.url.replace("/images/", "").split("?")[0]; // Strip query params
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
      res.setHeader("Cache-Control", "public, max-age=300");
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
