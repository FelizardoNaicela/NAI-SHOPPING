import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from "./theme/ThemeProvider";

import App from './App';

import { AuthProvider } from './auth/AuthProvider';
import { NotificationProvider } from './socket/notifications/NotificationContext';
import { UndoProvider } from './socket/notifications/UndoContext';
import { Toaster } from "react-hot-toast";
import "./styles/theme.css";
import "./index.css";
import "@fontsource-variable/inter";



ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
          <NotificationProvider>
            <UndoProvider>
              <App />
              <Toaster
        position="top-center"
    />
            </UndoProvider>
          </NotificationProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
