import { createContext, useContext } from 'react';

export const HubContext = createContext(null);

export function useHub() {
  const value = useContext(HubContext);
  if (!value) throw new Error('useHub must be used inside <HubProvider>');
  return value;
}
