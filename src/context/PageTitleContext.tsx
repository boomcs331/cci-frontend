"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageTitleContextType {
  title: string;
  description: string;
  setPageTitle: (title: string, description: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export const usePageTitle = () => {
  const context = useContext(PageTitleContext);
  if (!context) {
    throw new Error('usePageTitle must be used within PageTitleProvider');
  }
  return context;
};

interface PageTitleProviderProps {
  children: ReactNode;
}

export const PageTitleProvider: React.FC<PageTitleProviderProps> = ({ children }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const setPageTitle = (newTitle: string, newDescription: string) => {
    setTitle(newTitle);
    setDescription(newDescription);
  };

  return (
    <PageTitleContext.Provider value={{ title, description, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
};
