"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CanopyContextValue = {
  canopyIndex: number;
  setCanopyIndex: (index: number) => void;
};

const CanopyContext = createContext<CanopyContextValue>({
  canopyIndex: 0,
  setCanopyIndex: () => {},
});

export function CanopyProvider({ children }: { children: ReactNode }) {
  const [canopyIndex, setCanopyIndex] = useState<number>(0);

  return (
    <CanopyContext.Provider value={{ canopyIndex, setCanopyIndex }}>
      {children}
    </CanopyContext.Provider>
  );
}

export function useCanopy(): CanopyContextValue {
  return useContext(CanopyContext);
}
