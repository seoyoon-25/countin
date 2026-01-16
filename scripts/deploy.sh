#!/bin/bash

# CountIn Deployment Script
# Usage: ./scripts/deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/countin"
LOG_FILE="/var/log/countin-deploy.log"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CountIn Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Log function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    echo -e "${RED}Error: $1${NC}" >&2
    exit 1
}

# Navigate to app directory
cd "$APP_DIR" || error_exit "Failed to change to $APP_DIR"

# Step 1: Pull latest changes
echo -e "\n${YELLOW}Step 1: Pulling latest changes...${NC}"
log "Pulling latest changes from git"
git fetch origin main
git reset --hard origin/main

# Step 2: Install dependencies
echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
log "Installing dependencies with pnpm"
pnpm install --frozen-lockfile

# Step 3: Generate Prisma client
echo -e "\n${YELLOW}Step 3: Generating Prisma client...${NC}"
log "Generating Prisma client"
cd packages/database
pnpm prisma generate
cd "$APP_DIR"

# Step 4: Run database migrations
echo -e "\n${YELLOW}Step 4: Running database migrations...${NC}"
log "Running database migrations"
cd packages/database
pnpm prisma migrate deploy
cd "$APP_DIR"

# Step 5: Build the application
echo -e "\n${YELLOW}Step 5: Building application...${NC}"
log "Building application"
pnpm build

# Step 6: Restart PM2
echo -e "\n${YELLOW}Step 6: Restarting PM2...${NC}"
log "Restarting PM2 application"

# Check if countin is running
if pm2 describe countin > /dev/null 2>&1; then
    pm2 reload countin --update-env
else
    pm2 start ecosystem.config.js
fi

# Step 7: Save PM2 process list
echo -e "\n${YELLOW}Step 7: Saving PM2 process list...${NC}"
pm2 save

# Step 8: Health check
echo -e "\n${YELLOW}Step 8: Running health check...${NC}"
sleep 5

# Simple health check (adjust URL as needed)
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}Health check passed!${NC}"
    log "Health check passed"
else
    echo -e "${RED}Health check failed!${NC}"
    log "Health check failed"
    echo "Checking PM2 logs..."
    pm2 logs countin --lines 20
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Application URL: https://countin.bestcome.org"
echo "PM2 Status: pm2 status"
echo "View Logs: pm2 logs countin"
echo ""

log "Deployment completed successfully"
