import { useEffect } from 'react';

/**
 * Hook for syncing Zustand store state with localStorage
 * Automatically loads persisted state on mount and saves on changes
 */
export function useLocalStorageSync(
  key: string,
  getValue: () => any,
  setValue: (value: any) => void,
  validate?: (value: any) => boolean
) {
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!validate || validate(parsed)) {
          setValue(parsed);
          console.log(`[LocalStorage] Loaded ${key}:`, parsed);
        }
      }
    } catch (error) {
      console.error(`[LocalStorage] Failed to load ${key}:`, error);
    }
  }, [key, setValue, validate]);

  // Save to localStorage whenever value changes
  useEffect(() => {
    try {
      const value = getValue();
      localStorage.setItem(key, JSON.stringify(value));
      console.log(`[LocalStorage] Saved ${key}:`, value);
    } catch (error) {
      console.error(`[LocalStorage] Failed to save ${key}:`, error);
    }
  }, [key, getValue]);
}

/**
 * Interface for UI preferences that should be persisted
 */
export interface UIPreferences {
  gridEnabled: boolean;
  gridDensity: number;
  showSelectionBorders: boolean;
  selectionBorderAnimationSpeed: number;
  canvasBorderColor: string;
  canvasBorderWidth: number;
  canvasBorderOpacity: number;
}

/**
 * Get default UI preferences
 */
export function getDefaultUIPreferences(): UIPreferences {
  return {
    gridEnabled: false,
    gridDensity: 4,
    showSelectionBorders: true,
    selectionBorderAnimationSpeed: 1,
    canvasBorderColor: '#000000',
    canvasBorderWidth: 0,
    canvasBorderOpacity: 1,
  };
}

/**
 * Validate UI preferences structure
 */
export function validateUIPreferences(value: any): value is UIPreferences {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.gridEnabled === 'boolean' &&
    typeof value.gridDensity === 'number' &&
    typeof value.showSelectionBorders === 'boolean' &&
    typeof value.selectionBorderAnimationSpeed === 'number' &&
    typeof value.canvasBorderColor === 'string' &&
    typeof value.canvasBorderWidth === 'number' &&
    typeof value.canvasBorderOpacity === 'number'
  );
}
