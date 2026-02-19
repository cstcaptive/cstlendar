
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css'; // 确保样式被 Vite 捕获并打包

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
