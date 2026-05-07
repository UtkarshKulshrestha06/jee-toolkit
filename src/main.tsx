import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShortlistProvider } from './ShortlistContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShortlistProvider>
      <App />
    </ShortlistProvider>
  </StrictMode>,
);
