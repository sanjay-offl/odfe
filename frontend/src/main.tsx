import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles.css';

const client = new QueryClient();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><QueryClientProvider client={client}><BrowserRouter><App /></BrowserRouter><Toaster position="top-right" /></QueryClientProvider></React.StrictMode>
);
