# BlankPop Session Notes

## December 30, 2024 - DNS Setup

### Completed
- Configured DNS at Namecheap:
  - ALIAS record: `@` → `web-production-99c58.up.railway.app`
  - CNAME record: `www` → `web-production-99c58.up.railway.app`
- DNS propagated successfully to Railway
- Added custom domains in Railway (blankpop.online + www.blankpop.online)

### In Progress
- Port mismatch issue: Railway settings show port 3001, but app needs PORT=3001 env variable
- Set PORT=3001 in Variables, need to redeploy for it to take effect
- Getting 502 errors until port mismatch is resolved

### Next Steps
1. Redeploy after PORT variable is set
2. Verify logs show `localhost:3001`
3. Test `https://blankpop.online/mcp`

---

## December 29, 2024 - Initial Build

## What We Built
**BlankPop** - A ChatGPT App (MCP Server) for AI-designed merchandise using DALL-E 3

## What's Working
- MCP server with SSE transport (ChatGPT compatible)
- DALL-E 3 integration for design generation
- Product mockup tool
- Web component UI for product display
- **Railway deployment is LIVE**: `https://web-production-99c58.up.railway.app/mcp`

## Key Files
- `mcp-server.js` - Main MCP server with all tools
- `public/widget/product-widget.html` - Web component UI
- `nixpacks.toml` - Railway build config (Node 20)
- `railway.json` - Railway deployment config

## Environment Variables (in Railway)
- `OPENAI_API_KEY` - Already set
- `PORT` - Railway sets automatically
- `BASE_URL` - Optional, can add later

---

## TOMORROW: DNS Setup for blankpop.online

### Current DNS Status (WRONG)
- `blankpop.online` → 216.198.79.1 (registrar parking page)
- `www.blankpop.online` → Vercel (old config)

### Steps to Fix

#### Step 1: Add Domain in Railway
1. Go to: https://railway.app/project (your BlankPop project)
2. Click on the **web** service
3. Go to **Settings** tab → **Networking** section
4. Under **Public Networking**, click **Custom Domain**
5. Enter: `blankpop.online`
6. Railway will show you the required DNS record (likely a CNAME)

#### Step 2: Update DNS at Your Registrar
1. Log into your domain registrar
2. Go to DNS settings for blankpop.online
3. **Delete** the A record pointing to `216.198.79.1`
4. **Add** a CNAME record:
   - Name: `@` (or leave blank for root)
   - Target: `web-production-99c58.up.railway.app` (confirm in Railway)
5. Optional: Add www subdomain too
   - Name: `www`
   - Target: `web-production-99c58.up.railway.app`

#### Step 3: Wait for DNS Propagation (5-60 min)

#### Step 4: Test
```bash
curl -H "Accept: text/event-stream" "https://blankpop.online/mcp"
```

---

## After DNS: Test in ChatGPT

1. Go to ChatGPT → Settings → Customize ChatGPT
2. Click **Apps** (need Developer Mode enabled)
3. Create New App
4. Enter MCP URL: `https://blankpop.online/mcp`
5. Test with prompts like:
   - "Design a coffee mug with a smiling sun"
   - "Create a t-shirt with a galaxy cat"

---

## Working Railway URL (use while DNS propagates)
```
https://web-production-99c58.up.railway.app/mcp
```

---

## Remaining Tasks
- [ ] Configure DNS for blankpop.online
- [ ] Test ChatGPT connector with custom domain
- [ ] Submit to ChatGPT App Directory
