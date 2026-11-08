import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { HubProvider } from './context/hubProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <HubProvider>
        <App />
      </HubProvider>
    </BrowserRouter>
  </StrictMode>
);