# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the frontend of a Finance Management System built with React, TypeScript, and Vite. It's a comprehensive financial application with authentication, role-based permissions, and multiple modules for managing financial operations.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Technology Stack
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 7.0.4
- **Styling**: TailwindCSS 4.x with shadcn/ui components
- **State Management**: React Context (AuthContext) + TanStack Query for server state
- **Routing**: React Router DOM 7.x
- **HTTP Client**: Native fetch API with custom apiClient
- **PDF Generation**: jsPDF with jsPDF-AutoTable
- **Print**: QZ Tray integration for receipt printing

### Project Structure
- **`src/components/`**: Reusable UI components including shadcn/ui components in `ui/` subfolder
- **`src/context/`**: React contexts (AuthContext for authentication, UserContext, AppContext placeholder)
- **`src/hooks/`**: Custom hooks (useAuth, useModal, useTransactions, useUsers, useReports, useLocalStorage)
- **`src/layouts/`**: Layout components (DashboardLayout with fixed sidebar)
- **`src/pages/`**: Page components for each route
- **`src/routes/`**: Route protection components
- **`src/services/`**: API service layer with comprehensive endpoints
- **`src/utils/`**: Utility functions and constants
- **`src/styles/`**: Global styles and component-specific CSS

### Key Features
- JWT-based authentication with automatic token refresh
- Role-based access control (Admin, Supervisor roles)
- Financial modules: Transactions, Revenue/Expenditure Heads, Reports, Currency Management
- Member and Project management
- Receipt printing via QZ Tray
- PDF report generation
- Real-time dashboard

### Authentication Flow
- Uses JWT tokens with refresh token mechanism
- AuthContext provides user state, permissions, and token management
- Automatic token refresh with 5-minute threshold
- Protected routes via ProtectedRoute component
- Role-based UI rendering with isAdmin(), isSupervisor() checks

### API Integration
- Central API client in `services/api.ts` with Bearer token handling
- Base URL configured via VITE_API_URL environment variable (defaults to localhost:5000)
- Comprehensive API endpoints for all system modules
- React Query for caching and data synchronization

### UI/UX Patterns
- Fixed sidebar navigation (Navbar component) with main content area
- Modal system via CustomModal and useModal hook
- Consistent form patterns with validation
- Loading states and error handling throughout
- Status badges and empty states for better UX

### Path Aliases
- `@/*` maps to `src/*` for cleaner imports
- Configured in both tsconfig.json and vite.config.ts

## Development Notes

- The codebase follows modern React patterns with functional components and hooks
- TypeScript is configured for strict type checking
- ESLint configured with React and TypeScript rules
- Component library based on Radix UI primitives via shadcn/ui
- Uses class-variance-authority for component variants
- Print functionality requires QZ Tray desktop application for receipt printing