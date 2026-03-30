# Architecture Overview

## 🏗️ Project Architecture

---

## 📐 Architecture Patterns

### 1. **File-Based Routing (TanStack Router)**

**Pattern**: Routes are defined as files in the `src/routes/` directory.

**Benefits**:

- No manual route configuration
- Routes are co-located with their components
- Type-safe routing with javascript
- Automatic code splitting
- Route tree auto-generated

**Structure**:

```
src/routes/
├── __root.jsx          # Root layout (authentication, sidebar)
├── index.jsx           # Home route (/)
├── login.jsx           # Login route (/login)
├── users.jsx           # Users route (/users)
└── ...
```

**Key Files**:

- `__root.jsx`: Root route with layout and authentication logic
- `routeTree.gen.ts`: Auto-generated route tree (DO NOT EDIT)

---

### 2. **Server State Management (TanStack Query)**

**Pattern**: All server state is managed through TanStack Query (React Query).

**Benefits**:

- Automatic caching and refetching
- Background updates
- Optimistic updates support
- Request deduplication
- Error handling

**Setup**:

```javascript
// src/main.jsx
const queryClient = new QueryClient();
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>;
```

**Usage Pattern**:

- API functions in `src/apis/` directory
- Use `useQuery` for GET requests
- Use `useMutation` for POST/PUT/DELETE requests

---

### 3. **Component Architecture**

**Pattern**: Component composition with shadcn/ui primitives.

**Structure**:

```
src/components/
├── ui/                 # shadcn/ui base components
│   ├── button.jsx
│   ├── input.jsx
│   └── ...
├── sidebar.jsx         # Feature components
├── header-actions.jsx
└── ...
```

**Principles**:

- Reusable UI components in `components/ui/`
- Feature-specific components in `components/`
- Composition over configuration
- Props-based customization

---

### 4. **API Layer**

**Pattern**: Centralized API functions organized by domain.

**Structure**:

```
src/apis/
├── auth.ts            # Authentication endpoints
├── users.ts           # User management
├── bookings.ts        # Booking operations
└── ...
```

**Benefits**:

- Single source of truth for API calls
- Easy to mock for testing
- Consistent error handling
- Type-safe API responses

---

### 5. **Styling Architecture**

**Pattern**: Tailwind CSS v4 with CSS variables for theming.

**Key Features**:

- Utility-first CSS
- CSS variables for colors (OKLCH color space)
- Dark mode support via `.dark` class
- Custom theme variables in `@theme inline`
- Component variants using `class-variance-authority`

**Color System**:

- Uses OKLCH color space for better color consistency
- CSS variables for all colors
- Light/dark mode via CSS variables
- Semantic color names (primary, secondary, destructive, etc.)

---

### 6. **Type Safety**

**Pattern**: Strict javascript configuration with path aliases.

**Features**:

- Strict type checking enabled
- Path aliases (`@/*` → `src/*`)
- Project references for better performance
- Type-safe routing with TanStack Router
- Type-safe API calls

**Configuration**:

- `tsconfig.json`: Root config with path aliases
- `tsconfig.app.json`: Application-specific config
- `tsconfig.node.json`: Node-specific config (Vite)

---

### 7. **Authentication Flow**

**Pattern**: Route-level authentication with redirects.

**Implementation**:

```javascript
// src/routes/__root.jsx
beforeLoad: ({ location }) => {
  const token = localStorage.getItem("accessToken");
  const isLoginPath = location.pathname.startsWith("/login");

  if (!token && !isLoginPath) {
    throw redirect({ to: "/login", replace: true });
  }

  if (token && isLoginPath) {
    throw redirect({ to: "/", replace: true });
  }
};
```

**Flow**:

1. Check for token in localStorage
2. Redirect unauthenticated users to `/login`
3. Redirect authenticated users away from `/login`
4. Layout conditionally rendered based on route

---

### 8. **Layout System**

**Pattern**: Conditional layout rendering based on route.

**Structure**:

- Root route (`__root.jsx`) handles layout
- Login routes render without sidebar
- Authenticated routes render with sidebar
- `Outlet` component renders child routes

**Benefits**:

- Single layout configuration
- Easy to add/remove layout elements
- Consistent UI across authenticated routes

---

## 🔄 Data Flow

### 1. **Component → API → Server**

```
Component (useQuery/useMutation)
  ↓
API Function (src/apis/*.ts)
  ↓
Fetch Request
  ↓
Server Response
  ↓
TanStack Query Cache
  ↓
Component Re-render
```

### 2. **Route Navigation**

```
User Action
  ↓
TanStack Router Navigation
  ↓
beforeLoad Hook (authentication check)
  ↓
Route Component Render
  ↓
Child Routes Render (via Outlet)
```

---

## 🎨 Design System

### Color Palette

- **Primary**: Green (OKLCH: `oklch(0.6118 0.1995 142.08)`)
- **Secondary**: Neutral grays
- **Destructive**: Red for errors
- **Muted**: Subtle backgrounds
- **Accent**: Highlight colors

### Typography

- **Font Family**: Poppins (Google Fonts)
- **Weights**: 100-900 (variable font)

### Spacing

- Uses Tailwind's default spacing scale
- Consistent padding/margins via utility classes

### Components

- Built on Radix UI primitives
- Styled with Tailwind CSS
- Variants using `class-variance-authority`
- Accessible by default (Radix UI)

---

## 📦 Dependency Management

### Core Dependencies

- **React 19**: Latest React with concurrent features
- **javascript 5.8**: Latest javascript with strict mode
- **Vite 7**: Fast build tool and dev server

### Routing & State

- **TanStack Router**: File-based routing
- **TanStack Query**: Server state management
- **TanStack Table**: Table component (if needed)

### Styling

- **Tailwind CSS v4**: Utility-first CSS
- **Radix UI**: Headless UI primitives
- **Lucide React**: Icon library

### Utilities

- **clsx + tailwind-merge**: Class name utilities
- **class-variance-authority**: Component variants

---

## 🚀 Build & Development

### Development

```bash
npm run dev
```

- Vite dev server with HMR
- TanStack Router plugin watches route files
- Auto-generates route tree on changes

### Production Build

```bash
npm run build
```

- javascript type checking
- Vite production build
- Code splitting (via TanStack Router)
- Optimized assets

### Type Checking

```bash
tsc -b
```

- Uses project references
- Checks all javascript files
- Strict type checking

---

## 🔐 Security Considerations

1. **Authentication**: Token stored in localStorage (consider httpOnly cookies for production)
2. **Route Protection**: Handled at route level via `beforeLoad`
3. **API Security**: API keys/tokens should be in environment variables
4. **XSS Protection**: React automatically escapes content
5. **Type Safety**: javascript helps prevent runtime errors

---

## 📈 Performance Optimizations

1. **Code Splitting**: Automatic via TanStack Router
2. **Lazy Loading**: Routes loaded on demand
3. **Query Caching**: TanStack Query caches API responses
4. **Tree Shaking**: Vite automatically removes unused code
5. **Asset Optimization**: Vite optimizes images and assets

---

## 🧪 Testing Strategy (Recommended)

1. **Unit Tests**: Test utility functions and hooks
2. **Component Tests**: Test UI components in isolation
3. **Integration Tests**: Test API integration
4. **E2E Tests**: Test complete user flows

---

## 📝 Code Organization Principles

1. **Feature-Based**: Group related files together
2. **Separation of Concerns**: UI, logic, and data separate
3. **Reusability**: Extract common patterns into utilities
4. **Type Safety**: Use javascript for all code
5. **Consistency**: Follow established patterns

---

## 🔄 Migration Path

If migrating from another setup:

1. **From React Router**:
   - Convert route components to file-based routes
   - Update navigation to use TanStack Router hooks

2. **From Redux**:
   - Replace Redux with TanStack Query for server state
   - Use React Context for client-only state

3. **From Create React App**:
   - Migrate to Vite (faster builds)
   - Update import paths if needed

---

This architecture provides a solid foundation for building scalable, maintainable React applications with modern tooling and best practices.
