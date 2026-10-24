import { useMemo } from 'react';
import { useBudgetStore } from '../store/useBudgetStore';
import { appThemes, type AppTheme } from '../../budgetModel';

/**
 * Returns the current app theme colors for styling screens
 */
export const useTheme = (): AppTheme => {
  const appThemeId = useBudgetStore((state) => state.preferences.appThemeId);

  const theme = useMemo(() => appThemes[appThemeId], [appThemeId]);

  return theme;
};
