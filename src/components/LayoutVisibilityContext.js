"use client";

import React, { createContext, useContext } from 'react';

const LayoutVisibilityContext = createContext({ hideChrome: false });

export const useLayoutVisibility = () => {
  const context = useContext(LayoutVisibilityContext);
  // Return default values if context is not available
  return context || { hideChrome: false };
};

export const LayoutVisibilityProvider = ({ children, hideChrome = false }) => {
  return (
    <LayoutVisibilityContext.Provider value={{ hideChrome }}>
      {children}
    </LayoutVisibilityContext.Provider>
  );
};