import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './components/ui.jsx';
import './index.css';

// HashRouter: works from any static host or file server without rewrite rules.
createRoot(document.getElementById('root')).render(
  <HashRouter>
    <ToastProvider>
      <App />
    </ToastProvider>
  </HashRouter>,
);
