# Kartverket Tile Proxy

Simple Node.js proxy server that adds CORS headers to Kartverket map tiles, enabling client-side canvas export.

## Features

- Proxies Kartverket WMTS tile requests
- Adds CORS headers to allow canvas export
- Caches tiles for 24 hours
- Lightweight and fast
- Health check endpoint

## Deployment to Hetzner Server

### 1. Upload files to server

```bash
# On your local machine, from the tile-proxy directory
scp -r ./* root@YOUR_SERVER_IP:/opt/tile-proxy/
```

Or manually copy `server.js` and `package.json` to your server.

### 2. SSH into your Hetzner server

```bash
ssh root@YOUR_SERVER_IP
```

### 3. Install dependencies

```bash
cd /opt/tile-proxy
npm install
```

### 4. Test the server

```bash
npm start
```

You should see:
```
===========================================
Kartverket Tile Proxy Server
===========================================
Port: 3000
Health check: http://localhost:3000/health
Tile endpoint: http://localhost:3000/tiles/{z}/{y}/{x}.png
===========================================
```

Test health check (in another terminal):
```bash
curl http://localhost:3000/health
```

### 5. Set up PM2 (Process Manager)

Install PM2 to keep the server running:

```bash
npm install -g pm2
```

Start the proxy with PM2:

```bash
cd /opt/tile-proxy
pm2 start server.js --name tile-proxy
```

Make PM2 start on system boot:

```bash
pm2 startup
pm2 save
```

Check status:

```bash
pm2 status
pm2 logs tile-proxy
```

### 6. Configure Firewall

Allow traffic on port 3000:

```bash
ufw allow 3000/tcp
```

Or if you want to use a different port, set the PORT environment variable:

```bash
pm2 delete tile-proxy
PORT=8080 pm2 start server.js --name tile-proxy
pm2 save
```

### 7. Optional: Set up nginx reverse proxy

If you want to serve on port 80/443 with SSL:

Install nginx:
```bash
apt update
apt install nginx
```

Create nginx config (`/etc/nginx/sites-available/tile-proxy`):
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # CORS headers (already set by proxy, but can add here too)
        add_header Access-Control-Allow-Origin *;
    }
}
```

Enable and restart:
```bash
ln -s /etc/nginx/sites-available/tile-proxy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## API Endpoints

### Health Check
```
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "kartverket-tile-proxy"
}
```

### Tile Proxy
```
GET /tiles/{z}/{y}/{x}.png
```

Example:
```
http://your-server.com:3000/tiles/10/512/256.png
```

This proxies to:
```
https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/10/512/256.png
```

## Usage in Frontend

Update your Leaflet tile layer URL from:
```javascript
https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png
```

To:
```javascript
http://your-server.com:3000/tiles/{z}/{y}/{x}.png
```

## Monitoring

View logs:
```bash
pm2 logs tile-proxy
```

Restart server:
```bash
pm2 restart tile-proxy
```

Stop server:
```bash
pm2 stop tile-proxy
```

## Resource Usage

This proxy is very lightweight:
- Memory: ~30-50 MB
- CPU: Minimal (only when serving tiles)
- Network: Depends on your map usage

## Security

Current configuration allows all origins (`Access-Control-Allow-Origin: *`).

To restrict to your domain only, edit `server.js` line 14:
```javascript
res.header('Access-Control-Allow-Origin', 'https://your-domain.com');
```

## Troubleshooting

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000
# Or use a different port
PORT=8080 pm2 start server.js --name tile-proxy
```

**Server not accessible from outside:**
- Check firewall: `ufw status`
- Check server is listening: `netstat -tlnp | grep 3000`
- Check PM2 status: `pm2 status`

**Tiles not loading:**
- Check proxy logs: `pm2 logs tile-proxy`
- Test health endpoint: `curl http://localhost:3000/health`
- Test tile endpoint directly: `curl http://localhost:3000/tiles/5/17/9.png`
