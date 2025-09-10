'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface SDKContextType {
  isSDKReady: boolean;
  setSDKReady: (ready: boolean) => void;
}

const SDKContext = createContext<SDKContextType>({
  isSDKReady: false,
  setSDKReady: () => {},
});

export function SDKProvider({ children }: { children: React.ReactNode }) {
  const [isSDKReady, setIsSDKReady] = useState(false);

  const setSDKReady = useCallback((ready: boolean) => {
    setIsSDKReady(ready);
    console.log('SDK ready state changed to:', ready);
  }, []);

  return (
    <SDKContext.Provider value={{ isSDKReady, setSDKReady }}>
      {children}
    </SDKContext.Provider>
  );
}

export const useFarcasterSDK = () => useContext(SDKContext);