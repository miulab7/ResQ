import React from 'react';
import { createRoot } from 'react-dom/client';
import { MailProvider } from '../../../contexts/MailContext';
import { PersonalInfoProvider } from '../../../contexts/PersonalInfoContext';
import { ReplyEditorPage } from './ReplyEditorPage';
import '../../../../global.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <MailProvider>
      <PersonalInfoProvider>
        <ReplyEditorPage />
      </PersonalInfoProvider>
    </MailProvider>
  </React.StrictMode>
);