import { createContext } from 'react';
export const GamificationContext = createContext({
  profile: null,
  refreshProfile: () => {},
  triggerAward: async () => {}
});
