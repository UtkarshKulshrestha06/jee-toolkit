import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ShortlistProvider } from './ShortlistContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShortlistProvider>
      <App />
    </ShortlistProvider>
  </StrictMode>,
);
