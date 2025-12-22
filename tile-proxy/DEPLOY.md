# Deploy Tile Proxy to Vercel

This tile proxy adds CORS headers to Kartverket tiles, enabling canvas export on GitHub Pages.

## Quick Deploy Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Navigate to tile-proxy folder
```bash
cd tile-proxy
```

### 3. Deploy to Vercel
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your Vercel account
- **Link to existing project?** No
- **Project name?** kartverket-tile-proxy (or your choice)
- **Directory?** ./ (current directory)
- **Override settings?** No

### 4. Get your deployment URL
After deployment, Vercel will show your URL, like:
```
https://kartverket-tile-proxy.vercel.app
```

### 5. Update the main app config
In the main project `js/config.js`, update:
```javascript
const TILE_SERVER_VERCEL = 'https://YOUR-URL.vercel.app/tiles/{z}/{y}/{x}.png';
export const TILE_SERVER_URL = TILE_SERVER_VERCEL;
```

### 6. Test the proxy
Visit: `https://YOUR-URL.vercel.app/health`

Should return: `{"status":"ok","service":"kartverket-tile-proxy"}`

## Redeploy (after changes)
```bash
cd tile-proxy
vercel --prod
```

## Environment
- Node.js 14+ (Vercel serverless)
- Free tier: 100GB bandwidth/month
- Automatic HTTPS
- Global CDN

## Troubleshooting
- If tiles don't load: Check CORS headers in browser DevTools Network tab
- If 404 errors: Verify vercel.json routes configuration
- Check Vercel dashboard for logs: https://vercel.com/dashboard
