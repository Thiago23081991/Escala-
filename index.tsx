
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// O polyfill agora reside no index.html para maior segurança no carregamento.

const init = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Não foi possível encontrar o elemento root para montar o app.");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Garante que o script rode após o carregamento do DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
