import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router';
import './index.css';
import App from './App.tsx';
import DocsPage from './pages/Docs.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/docs" element={<DocsPage />}>
          <Route path=":docId" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
