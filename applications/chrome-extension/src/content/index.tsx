import React from 'react';
import { createRoot } from 'react-dom/client';
import Content from './Content';
import './twind';

// コンテンツスクリプトのマウントポイントを作成
const mountPoint = document.createElement('div');
mountPoint.id = 'resq-extension-root';
document.body.appendChild(mountPoint);

// Reactアプリケーションをマウント
const root = createRoot(mountPoint);
root.render(
  <React.StrictMode>
    <Content />
  </React.StrictMode>
);

// スタイルの適用
const style = document.createElement('style');
style.textContent = `
  #resq-extension-root {
    position: fixed;
    z-index: 9999;
    top: 0;
    right: 0;
  }
`;
document.head.appendChild(style);
