// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // Changed import
import App from './App';
import AppThemeProvider from './theme/ThemeProvider';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <AppThemeProvider>
        <App />
      </AppThemeProvider>
    </HashRouter>
  </React.StrictMode>,
);
