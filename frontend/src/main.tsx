// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import React Query
import { BrowserRouter } from 'react-router-dom'; // Import React Router
import App from './App';
import './index.css'

// Create a client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // Data considered fresh for 5 minutes
            refetchOnWindowFocus: true, // Refetch data when window regains focus
            retry: 3, // Retry failed queries 3 times
        },
    },
});

const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js";
script.onload = () => {
  console.log("QZ Tray JS loaded");
};
document.head.appendChild(script);

const root = createRoot(document.getElementById('root')!);
root.render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </QueryClientProvider>
    </StrictMode>,
);
