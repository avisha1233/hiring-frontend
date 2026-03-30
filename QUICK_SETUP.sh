 #!/bin/bash

# Quick Setup Script for React + javascript + Vite + TanStack Router Project
# This script replicates the setup used in clove-lab-dashboard

set -e  # Exit on error

PROJECT_NAME=${1:-"my-react-app"}

echo "🚀 Setting up $PROJECT_NAME..."

# Step 1: Initialize Vite project
echo "📦 Step 1: Creating Vite project..."
npm create vite@latest "$PROJECT_NAME" -- --template react-ts
cd "$PROJECT_NAME"

# Step 2: Install dependencies
echo "📦 Step 2: Installing dependencies..."
npm install

# Step 3: Install core dependencies
echo "📦 Step 3: Installing core dependencies..."
npm install @tanstack/react-router @tanstack/react-query @tanstack/react-table
npm install -D @tanstack/router-plugin

# Step 4: Install styling dependencies
echo "📦 Step 4: Installing styling dependencies..."
npm install tailwindcss @tailwindcss/vite tw-animate-css
npm install clsx tailwind-merge class-variance-authority

# Step 5: Install UI component dependencies
echo "📦 Step 5: Installing UI component dependencies..."
npm install @radix-ui/react-alert-dialog @radix-ui/react-dialog \
            @radix-ui/react-label @radix-ui/react-popover \
            @radix-ui/react-slot @radix-ui/react-switch

# Step 6: Install icons and utilities
echo "📦 Step 6: Installing icons and utilities..."
npm install lucide-react
npm install react-to-print html2canvas jspdf jsbarcode
npm install -D @types/jspdf @types/jsbarcode

# Step 7: Install ESLint dependencies
echo "📦 Step 7: Installing ESLint dependencies..."
npm install -D @eslint/js globals eslint-plugin-react-hooks \
                eslint-plugin-react-refresh javascript-eslint

echo "✅ Dependencies installed!"
echo ""
echo "📝 Next steps:"
echo "1. Update vite.config.ts (see SETUP_GUIDE.md)"
echo "2. Update tsconfig files (see SETUP_GUIDE.md)"
echo "3. Setup Tailwind CSS in src/index.css"
echo "4. Create routes directory structure"
echo "5. Configure components.json for shadcn/ui (optional)"
echo ""
echo "📚 See SETUP_GUIDE.md for detailed configuration instructions"
