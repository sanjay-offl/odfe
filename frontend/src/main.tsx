import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles.css';

const client = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{ duration: 1400, style: { borderRadius: '10px', fontSize: '13px' } }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
