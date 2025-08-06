import React, { createContext, useContext, useState } from 'react';

interface StyleContextProps {
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
}

const StyleContext = createContext<StyleContextProps>({
  selectedStyle: 'default',
  setSelectedStyle: () => {},
});

export function StyleProvider({ children }: { children: React.ReactNode }) {
  const [selectedStyle, setSelectedStyle] = useState<string>('default');

  return (
    <StyleContext.Provider value={{ selectedStyle, setSelectedStyle }}>
      {children}
    </StyleContext.Provider>
  );
}

export function useStyle() {
  return useContext(StyleContext);
}
