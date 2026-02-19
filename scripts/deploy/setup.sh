#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="helloman"
APP_DIR="$(pwd)"
NGINX_CONF_PATH="/etc/nginx/sites-available/$APP_NAME"
NGINX_TEMPLATE_PATH="$APP_DIR/scripts/deploy/nginx.template.conf"

# Color codes
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment setup for $APP_NAME...${NC}"

DOMAIN=hellomanbd.com
EMAIL=contact@sunpodder.com

# 5. Install Project Dependencies & Build
echo -e "${GREEN}Installing project dependencies...${NC}"
npm install

echo -e "${GREEN}Building the application...${NC}"
npm run build

# 6. Setup PM2
echo -e "${GREEN}Configuring PM2...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup | grep "sudo" | bash || true # Execute the command PM2 prints if it contains sudo

# 7. Setup Nginx
echo -e "${GREEN}Configuring Nginx...${NC}"
# Read template and replace placeholder
sudo cp "$NGINX_TEMPLATE_PATH" "$NGINX_CONF_PATH"
sudo sed -i "s/{{DOMAIN_NAME}}/$DOMAIN/g" "$NGINX_CONF_PATH"

# Enable site
sudo ln -sf "$NGINX_CONF_PATH" "/etc/nginx/sites-enabled/"
# Remove default if only one site desired, usually safer to leave unless conflicting
# sudo rm /etc/nginx/sites-enabled/default 

sudo nginx -t
sudo systemctl reload nginx

# 8. Setup SSL with Certbot
echo -e "${GREEN}Setting up SSL with Certbot...${NC}"
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "Your app should be live at https://$DOMAIN"
