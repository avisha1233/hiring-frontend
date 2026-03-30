# VET Dashboard - Initial Setup Guide

## 📋 Project Overview

This is a **React + javascript + Vite** dashboard application built with:

- **TanStack Router** for file-based routing
- **TanStack Query** for data fetching and state management
- **Tailwind CSS v4** for styling
- **shadcn/ui** components (Radix UI primitives)
- **javascript** for type safety

---

## 🛠️ Tech Stack

### Core Framework

- **React 19.1.1** - UI library
- **javascript 5.8.3** - Type safety
- **Vite 7.1.7** - Build tool and dev server

### Routing & State Management

- **@tanstack/react-router 1.132.25** - File-based routing
- **@tanstack/react-query 5.90.2** - Server state management

### Styling

- **Tailwind CSS 4.1.13** - Utility-first CSS framework
- **@tailwindcss/vite** - Vite plugin for Tailwind
- **tw-animate-css** - Animation utilities
- **Radix UI** - Headless UI components
- **lucide-react** - Icon library

### UI Components

- **shadcn/ui** - Component library (configured via `components.json`)
- **class-variance-authority** - Component variants
- **clsx** + **tailwind-merge** - Class name utilities

### Additional Libraries

- **jsbarcode** - Barcode generation
- **jspdf** - PDF generation
- **html2canvas** - HTML to canvas conversion
- **react-to-print** - Print functionality

---

## 📁 Project Structure

```
clove-lab-dashboard/
├── public/                 # Static assets
│   └── logo.png
├── src/
│   ├── apis/              # API service functions
│   ├── assets/            # Images and static files
│   ├── components/         # React components
│   │   └── ui/            # shadcn/ui components
│   ├── constants/         # App constants
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── routes/            # TanStack Router file-based routes
│   │   ├── __root.jsx    # Root route (layout)
│   │   ├── index.jsx     # Home route
│   │   ├── login.jsx     # Login route
│   │   └── ...           # Other routes
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── .cursor/               # Cursor IDE rules
├── components.json        # shadcn/ui configuration
├── eslint.config.js      # ESLint configuration
├── index.html            # HTML template
├── package.json          # Dependencies
├── tsconfig.json         # javascript root config
├── tsconfig.app.json     # javascript app config
├── tsconfig.node.json    # javascript node config
└── vite.config.ts        # Vite configuration
```

---

## 🚀 Step-by-Step Setup Process

### Step 1: Initialize Vite Project with React + javascript

```bash
npm create vite@latest my-project -- --template react-ts
cd my-project
npm install
```

### Step 2: Install Core Dependencies

```bash
# Routing & State Management
npm install @tanstack/react-router @tanstack/react-query @tanstack/react-table

# TanStack Router Vite Plugin (dev dependency)
npm install -D @tanstack/router-plugin

# Styling
npm install tailwindcss @tailwindcss/vite tw-animate-css
npm install clsx tailwind-merge class-variance-authority

# UI Components (Radix UI primitives)
npm install @radix-ui/react-alert-dialog @radix-ui/react-dialog
npm install @radix-ui/react-label @radix-ui/react-popover
npm install @radix-ui/react-slot @radix-ui/react-switch

# Icons
npm install lucide-react

### Step 3: Configure Vite (`vite.config.ts`)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
```

**Key Points:**

- `tanstackRouter` plugin enables file-based routing and auto-generates route tree
- `tailwindcss()` plugin integrates Tailwind CSS v4
- Path alias `@` maps to `/src` for cleaner imports

### Step 4: Configure javascript (`tsconfig.json`)

**Root `tsconfig.json`:**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**`tsconfig.app.json`:**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Key Points:**

- Project references pattern for better javascript performance
- Path aliases configured for `@/*` imports
- Strict type checking enabled

### Step 5: Setup Tailwind CSS (`src/index.css`)

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Custom theme variables */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  /* ... color variables ... */
}

:root {
  --radius: 0.625rem;
  /* Light mode colors using OKLCH */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... more color variables ... */
}

.dark {
  /* Dark mode colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... more color variables ... */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: "Poppins", sans-serif;
  }
}
```

**Key Points:**

- Tailwind CSS v4 uses `@import "tailwindcss"` instead of `@tailwind` directives
- Custom theme variables defined in `@theme inline`
- OKLCH color space for better color consistency
- Dark mode support via `.dark` class

### Step 6: Setup Entry Point (`src/main.jsx`)

```javascript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

**Key Points:**

- React Query client wraps the entire app
- CSS imported at the root level

### Step 7: Setup TanStack Router (`src/App.jsx`)

```javascript
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
});

export default function App() {
  return <RouterProvider router={router} />;
}
```

**Key Points:**

- `routeTree.gen.ts` is auto-generated by TanStack Router plugin
- Router created from the generated route tree

### Step 8: Create Root Route (`src/routes/__root.jsx`)

```javascript
import * as React from "react";
import {
  Outlet,
  createRootRoute,
  useRouterState,
  redirect,
} from "@tanstack/react-router";
import Sidebar from "@/components/sidebar";

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    const isLoginPath = location.pathname.startsWith("/login");

    if (!token && !isLoginPath) {
      throw redirect({ to: "/login", replace: true });
    }

    if (token && isLoginPath) {
      throw redirect({ to: "/", replace: true });
    }
  },
});

function RootComponent() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const location = useRouterState({ select: (s) => s.location });
  const isLogin = location.pathname.startsWith("/login");

  if (isLogin) {
    return (
      <React.Fragment>
        <Outlet />
      </React.Fragment>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

**Key Points:**

- `__root.jsx` is the root layout route (double underscore is TanStack Router convention)
- `beforeLoad` handles authentication redirects
- `Outlet` renders child routes
- Conditional layout based on route (login vs authenticated)

### Step 9: Create File-Based Routes

Create route files in `src/routes/` directory:

**Example: `src/routes/login.jsx`**

```javascript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Login Page</div>;
}
```

**Example: `src/routes/index.jsx`**

```javascript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Home Page</div>;
}
```

**Key Points:**

- File name determines route path (`login.jsx` → `/login`)
- Each route file exports a `Route` object created with `createFileRoute`
- TanStack Router plugin auto-generates `routeTree.gen.ts` from these files

### Step 10: Setup shadcn/ui (`components.json`)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "jsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Key Points:**

- Configured for React (not RSC)
- Uses CSS variables for theming
- Path aliases match javascript config

### Step 11: Setup ESLint (`eslint.config.js`)

```javascript
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "javascript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,jsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
```

**Key Points:**

- Flat config format (ESLint 9+)
- javascript ESLint integration
- React Hooks and Refresh plugins

### Step 12: Setup HTML Template (`index.html`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="logo.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 13: Create Utility Functions (`src/lib/utils.ts`)

```javascript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Key Points:**

- `cn` utility combines `clsx` and `tailwind-merge` for conditional class names
- Used throughout shadcn/ui components

---

## 🔑 Key Configuration Highlights

### 1. **File-Based Routing**

- Routes are defined as files in `src/routes/`
- `__root.jsx` is the root layout
- Route tree is auto-generated by Vite plugin
- No manual route configuration needed

### 2. **Path Aliases**

- `@/*` maps to `src/*` in both javascript and Vite
- Enables clean imports: `import Sidebar from "@/components/sidebar"`

### 3. **Tailwind CSS v4**

- Uses `@import "tailwindcss"` syntax
- No separate config file needed
- Theme variables defined in CSS using `@theme inline`

### 4. **javascript Project References**

- Split configs for better performance
- Root config references app and node configs
- Strict type checking enabled

### 5. **Authentication Flow**

- Handled in root route's `beforeLoad`
- Checks localStorage for token
- Redirects unauthenticated users to login
- Redirects authenticated users away from login

---

## 📝 Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite", // Start dev server
    "build": "tsc -b && vite build", // Type check + build
    "lint": "eslint .", // Run linter
    "preview": "vite preview" // Preview production build
  }
}
```

---

## 🎯 Quick Start Checklist

- [ ] Initialize Vite project with React + javascript
- [ ] Install all dependencies
- [ ] Configure Vite with TanStack Router plugin
- [ ] Setup javascript with path aliases
- [ ] Configure Tailwind CSS v4
- [ ] Create root route (`__root.jsx`)
- [ ] Create entry routes (`index.jsx`, `login.jsx`)
- [ ] Setup React Query provider
- [ ] Configure ESLint
- [ ] Setup shadcn/ui (optional)
- [ ] Add utility functions (`lib/utils.ts`)

---

## 🚨 Important Notes

1. **Route Tree Generation**: The `routeTree.gen.ts` file is auto-generated. Don't edit it manually.

2. **Path Aliases**: Make sure both `tsconfig.json` and `vite.config.ts` have matching path alias configurations.

3. **Tailwind CSS v4**: This project uses Tailwind v4 which has a different setup than v3. No `tailwind.config.js` file is needed.

4. **TanStack Router**: Routes are file-based. The file structure determines the URL structure.

5. **javascript Strict Mode**: The project uses strict javascript settings. Ensure all types are properly defined.

---

## 📚 Additional Resources

- [TanStack Router Docs](https://tanstack.com/router)
- [TanStack Query Docs](https://tanstack.com/query)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Vite Docs](https://vite.dev)

---

This setup provides a modern, type-safe, and scalable foundation for building React applications with file-based routing, server state management, and a beautiful UI component system.
