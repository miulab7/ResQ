import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { PersonalInformation } from '../types';

interface PersonalInfoContextType {
  personalInfo: PersonalInformation;
  updatePersonalInfo: (data: Partial<PersonalInformation>) => void;
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const defaultPersonalInfo: PersonalInformation = {
  fullName: "",
  email: "",
  affiliation: "",
  language: "",
  role: "",
  signature: "",
  otherInfo: ""
};

const PersonalInfoContext = createContext<PersonalInfoContextType | undefined>(undefined);

export function PersonalInfoProvider({ children }: { children: ReactNode }) {
  const [personalInfo, setPersonalInfo] = useState<PersonalInformation>(defaultPersonalInfo);

  const updatePersonalInfo = (data: Partial<PersonalInformation>) => {
    setPersonalInfo(prev => ({ ...prev, ...data }));
  };

  const saveToStorage = async () => {
    try {
      await chrome.storage.local.set(personalInfo);
      chrome.runtime.sendMessage({
        action: 'updatePersonalInformation',
        data: personalInfo
      });
    } catch (error) {
      console.error('Failed to save personal information:', error);
    }
  };

  const loadFromStorage = async () => {
    try {
      const result = await chrome.storage.local.get([
        'fullName',
        'email',
        'affiliation',
        'language',
        'role',
        'signature',
        'otherInfo'
      ]);

      if (Object.keys(result).length > 0) {
        setPersonalInfo(prev => ({
          ...prev,
          ...(result as PersonalInformation)
        }));
      }
    } catch (error) {
      console.error('Failed to load personal information:', error);
    }
  };

  // 初回マウント時にストレージからデータを読み込む
  useEffect(() => {
    loadFromStorage();
  }, []);

  return (
    <PersonalInfoContext.Provider
      value={{
        personalInfo,
        updatePersonalInfo,
        saveToStorage,
        loadFromStorage
      }}
    >
      {children}
    </PersonalInfoContext.Provider>
  );
}

export function usePersonalInfo() {
  const context = useContext(PersonalInfoContext);
  if (context === undefined) {
    throw new Error('usePersonalInfo must be used within a PersonalInfoProvider');
  }
  return context;
}