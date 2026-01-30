# Production Deployment

Deploy Laju applications with **build on server** and **auto-deploy via GitHub Actions**.

## Quick Start - First Time Deploy

First time server setup:

```bash
# 1. SSH to server
ssh root@your-server-ip

# 2. Install Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22

# 3. Install PM2
npm install -g pm2

# 4. Clone repository & build
cd /root
git clone https://github.com/yourusername/your-app.git laju
cd laju
npm install
npm run build

# 5. Setup environment
cp .env.example .env
nano .env  # Edit as needed

# 6. Run migrations (data folder already exists with .gitkeep)
DB_CONNECTION=production npm run migrate

# 7. Start with PM2
pm2 start build/server.js --name laju
pm2 save
pm2 startup
```

## PM2 Commands

```bash
pm2 logs laju        # View logs
pm2 restart laju     # Restart
pm2 reload laju      # Zero-downtime reload
pm2 status           # Status
pm2 monit            # Monitor resources
```

## HTTPS with Nginx

### Install & Configure

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/laju`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5555;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/laju /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

## HTTPS with Caddy

Caddy is simpler - it handles automatic HTTPS with Let's Encrypt out of the box.

### Install & Configure

```bash
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

Create `/etc/caddy/Caddyfile`:

```caddy
yourdomain.com {
    reverse_proxy localhost:5555
}
```

```bash
# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Start Caddy
sudo systemctl enable caddy
sudo systemctl start caddy

# Caddy automatically obtains and renews SSL certificates!
```

### Caddy vs Nginx

| Feature | Caddy | Nginx |
|---------|-------|-------|
| HTTPS Setup | Automatic (zero config) | Manual (certbot) |
| SSL Renewal | Automatic | Automatic (certbot) |
| Configuration | Simple | More complex |
| Performance | Good | Excellent |
| Learning Curve | Easy | Moderate |

## HTTPS with Cloudflare

Skip Nginx/Caddy entirely - use Cloudflare as reverse proxy with SSL termination.

### Setup

1. **Point domain to Cloudflare:**
   - Change nameservers to Cloudflare
   - Add A record pointing to your server IP

2. **Enable Cloudflare Proxy:**
   - Set DNS record to **Proxied** (orange cloud)

3. **Configure Laju for Cloudflare:**

Update `.env`:
```env
TRUST_PROXY=true
```

Update `server.ts`:
```typescript
const option = {
  max_body_length: 10 * 1024 * 1024,
  trust_proxy: process.env.TRUST_PROXY === 'true',
};
```

4. **Create Origin Rule** (to route to port 5555):
   - Go to **Rules** → **Origin Rules**
   - Field: **Hostname** → Operator: **equals** → Value: `yourdomain.com`
   - Setting: **Port** → Value: `5555`

### Cloudflare vs Nginx/Caddy

| Feature | Cloudflare | Nginx | Caddy |
|---------|-----------|-------|-------|
| HTTPS Setup | Automatic (DNS) | Manual (certbot) | Automatic |
| SSL Termination | Yes | Yes | Yes |
| DDoS Protection | Built-in | No | No |
| CDN | Global | No | No |

## Troubleshooting

### Application Won't Start

```bash
pm2 logs laju --lines 50    # Check logs
cat .env                     # Verify env
node --version               # Check Node version
sudo lsof -i :5555           # Check port
```

### Database Errors

```bash
ls -lh data/production.sqlite3                           # Check file
sqlite3 data/production.sqlite3 "PRAGMA journal_mode;"   # Verify WAL
```

### NVM Not Found (GitHub Actions)

Make sure the script loads NVM:
```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

## Next Steps

- [CI/CD](/guide/cicd) - Setup GitHub Actions auto-deployment
- [Testing](/guide/testing) - Test your deployment
