# Export Functionality Setup Guide

The map export functionality requires a tile proxy server to add CORS headers to Kartverket tiles.

## Overview

**Problem:** Kartverket tiles don't have CORS headers, causing canvas to be "tainted" and blocking export.

**Solution:** Proxy server that adds CORS headers to tiles, allowing clean canvas export.

---

## Setup Steps

### 1. Deploy Tile Proxy to Hetzner Server

```bash
# 1. SSH into your Hetzner server
ssh root@YOUR_SERVER_IP

# 2. Create directory
mkdir -p /opt/tile-proxy
cd /opt/tile-proxy

# 3. Upload files (from your local machine in another terminal)
# Navigate to the tile-proxy folder first
cd C:\Users\Tewodros\Desktop\apps\kartverkClaude\tile-proxy
scp server.js package.json root@YOUR_SERVER_IP:/opt/tile-proxy/

# 4. Back on server - Install dependencies
npm install

# 5. Test the server
npm start
# You should see: "Kartverket Tile Proxy Server" running on port 3000

# 6. Install PM2 (process manager)
npm install -g pm2

# 7. Start with PM2
pm2 start server.js --name tile-proxy
pm2 save
pm2 startup  # Follow the command it gives you

# 8. Allow firewall access
ufw allow 3000/tcp

# 9. Check status
pm2 status
pm2 logs tile-proxy
```

### 2. Test Proxy Server

From your local machine:
```bash
# Test health check
curl http://YOUR_SERVER_IP:3000/health

# Test tile fetch
curl http://YOUR_SERVER_IP:3000/tiles/10/512/256.png --output test-tile.png
# Should download a map tile image
```

### 3. Update Frontend Configuration

Edit `js/config.js`:

```javascript
// Change from:
export const TILE_SERVER_URL = TILE_SERVER_DIRECT;

// To:
const TILE_SERVER_PROXY = 'http://YOUR_SERVER_IP:3000/tiles/{z}/{y}/{x}.png';
export const TILE_SERVER_URL = TILE_SERVER_PROXY;
```

**Replace `YOUR_SERVER_IP`** with your actual Hetzner server IP address.

### 4. Test Export Functionality

1. Open your application in the browser
2. Load a map with some signs
3. Click "Eksporter til bilde"
4. Check console for success messages:
   - "Map captured successfully"
   - "Blob created successfully"
   - "Downloaded: avplan_YYYY-MM-DD.png"

---

## Verification Checklist

- [ ] Proxy server is running (`pm2 status` shows "online")
- [ ] Health check works (`curl http://YOUR_SERVER_IP:3000/health`)
- [ ] Tile fetch works (test URL returns PNG image)
- [ ] Firewall allows port 3000 (`ufw status`)
- [ ] Frontend config.js updated with server IP
- [ ] Map loads correctly in browser
- [ ] Export downloads PNG file successfully

---

## Troubleshooting

### Map tiles don't load
- Check browser console for errors
- Verify proxy server is running: `pm2 logs tile-proxy`
- Test tile URL directly in browser: `http://YOUR_SERVER_IP:3000/tiles/5/17/9.png`
- Check firewall: `ufw status`

### Export still fails with "tainted canvas"
- Verify you're using `TILE_SERVER_PROXY` in config.js
- Check that tiles are loading from your proxy server (Network tab in browser dev tools)
- Clear browser cache and reload

### Proxy server stops
- Check logs: `pm2 logs tile-proxy`
- Restart: `pm2 restart tile-proxy`
- Check if port 3000 is already in use: `lsof -i :3000`

### Performance issues
- Proxy uses minimal resources (~30-50MB RAM)
- If needed, increase PM2 instances: `pm2 scale tile-proxy 2`
- Consider adding nginx caching for frequently accessed tiles

---

## Optional: HTTPS with nginx

For production with SSL:

```bash
# Install nginx and certbot
apt install nginx certbot python3-certbot-nginx

# Create nginx config
nano /etc/nginx/sites-available/tile-proxy
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        add_header Access-Control-Allow-Origin *;
    }
}
```

```bash
# Enable and get SSL
ln -s /etc/nginx/sites-available/tile-proxy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
certbot --nginx -d your-domain.com
```

Then update config.js to:
```javascript
const TILE_SERVER_PROXY = 'https://your-domain.com/tiles/{z}/{y}/{x}.png';
```

---

## Files Changed

**New files:**
- `tile-proxy/server.js` - Proxy server code
- `tile-proxy/package.json` - Dependencies
- `tile-proxy/README.md` - Detailed documentation
- `js/config.js` - Configuration module

**Modified files:**
- `js/map-manager.js` - Uses config for tile URL, added crossOrigin
- `js/export.js` - Uses useCORS instead of allowTaint

---

## Cost & Resources

- Server: ~30-50MB RAM, minimal CPU
- Network: Depends on usage (each tile ~5-20KB)
- Hetzner small VPS is more than sufficient

---

## Security Notes

Current config allows all origins (`Access-Control-Allow-Origin: *`).

To restrict to your domain only, edit `tile-proxy/server.js` line 14:
```javascript
res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
```

---

## Summary

1. Deploy proxy server to Hetzner
2. Update config.js with server IP
3. Export should now work!

The proxy adds CORS headers, making tiles exportable without canvas tainting.
