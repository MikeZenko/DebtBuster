#!/bin/bash

# 🚀 DebtTruth Coach - DigitalOcean Deployment Script
echo "🌊 Starting DigitalOcean deployment for DebtTruth Coach..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Full stack DebtTruth Coach"
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    print_warning "No git remote origin found"
    echo "Please set up your GitHub repository:"
    echo "1. Create a new repository on GitHub"
    echo "2. Run: git remote add origin https://github.com/your-username/debttruth-coach.git"
    echo "3. Run this script again"
    exit 1
fi

# Ensure we're on main branch
print_status "Switching to main branch..."
git checkout main 2>/dev/null || git checkout -b main

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main 2>/dev/null || print_warning "Could not pull from origin (this is normal for first deployment)"

# Stage all changes
print_status "Staging changes..."
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    print_status "No changes to commit"
else
    print_status "Committing changes..."
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push to GitHub
print_status "Pushing to GitHub..."
if git push origin main; then
    print_success "Successfully pushed to GitHub"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

# Check if doctl is installed
if command -v doctl &> /dev/null; then
    print_status "DigitalOcean CLI (doctl) found"
    
    # Check if app spec exists
    if [ -f ".do/app.yaml" ]; then
        print_status "App spec found, checking for existing app..."
        
        # Check if DIGITALOCEAN_APP_ID is set
        if [ -n "$DIGITALOCEAN_APP_ID" ]; then
            print_status "Updating existing app (ID: $DIGITALOCEAN_APP_ID)..."
            doctl apps update $DIGITALOCEAN_APP_ID --spec .do/app.yaml
            print_success "App update initiated"
        else
            print_status "Creating new app with app spec..."
            APP_ID=$(doctl apps create --spec .do/app.yaml --format ID --no-header)
            if [ $? -eq 0 ]; then
                print_success "App created with ID: $APP_ID"
                echo "To update this app in the future, set: export DIGITALOCEAN_APP_ID=$APP_ID"
            else
                print_error "Failed to create app"
            fi
        fi
    else
        print_warning "No app spec found at .do/app.yaml"
        print_status "You'll need to create the app manually in the DigitalOcean console"
    fi
else
    print_warning "DigitalOcean CLI (doctl) not found"
    print_status "Install it with: brew install doctl"
    print_status "Or follow manual deployment steps in DIGITALOCEAN_DEPLOYMENT.md"
fi

# Generate security secrets if they don't exist
print_status "Checking security configuration..."

if command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    
    echo ""
    print_success "Generated new JWT secrets (save these for your environment variables):"
    echo ""
    echo "JWT_SECRET=$JWT_SECRET"
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
    echo ""
else
    print_warning "OpenSSL not found - you'll need to generate JWT secrets manually"
fi

# Final instructions
echo ""
print_success "Deployment process completed!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 🌐 Visit DigitalOcean App Platform: https://cloud.digitalocean.com/apps"
echo "2. 🔧 Configure environment variables with the secrets shown above"
echo "3. 🗄️  Add a managed PostgreSQL database to your app"
echo "4. 🔗 Set up your Plaid credentials (PLAID_CLIENT_ID, PLAID_SECRET)"
echo "5. 🌍 Update CORS origins for your frontend domain"
echo ""
echo "📚 Full documentation: DIGITALOCEAN_DEPLOYMENT.md"
echo ""
echo "🎯 Estimated monthly cost: ~$14 (Backend + Database)"
echo ""
print_success "Your DebtTruth Coach is ready for DigitalOcean! 🌊"
