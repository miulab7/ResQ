import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MailData } from '../types';

interface MailContextType {
  mailData: MailData;
  updateMailData: (data: Partial<MailData>) => void;
  contentTabId: number;
  setContentTabId: (id: number) => void;
  replyEditorTabId: number;
  setReplyEditorTabId: (id: number) => void;
}

const defaultMailData: MailData = {
  html: "",
  text: "",
  title: "",
  sender: "",
  pastHtml: "",
  receiveTime: "",
  now: ""
};

const MailContext = createContext<MailContextType | undefined>(undefined);

export function MailProvider({ children }: { children: ReactNode }) {
  const [mailData, setMailData] = useState<MailData>(defaultMailData);
  const [contentTabId, setContentTabId] = useState<number>(0);
  const [replyEditorTabId, setReplyEditorTabId] = useState<number>(0);

  const updateMailData = (data: Partial<MailData>) => {
    setMailData(prev => ({ ...prev, ...data }));
  };

  return (
    <MailContext.Provider
      value={{
        mailData,
        updateMailData,
        contentTabId,
        setContentTabId,
        replyEditorTabId,
        setReplyEditorTabId,
      }}
    >
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (context === undefined) {
    throw new Error('useMail must be used within a MailProvider');
  }
  return context;
}