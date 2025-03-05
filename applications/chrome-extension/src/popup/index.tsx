import React from 'react';
import { createRoot } from 'react-dom/client';
import { PersonalInfoProvider } from '../app/contexts/PersonalInfoContext';
import Popup from './Popup';
import '../global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <PersonalInfoProvider>
      <Popup />
    </PersonalInfoProvider>
  </React.StrictMode>
);
