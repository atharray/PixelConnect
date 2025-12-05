/**
 * Custom hook for automatic history tracking
 * Debounces and tracks significant state changes
 */

import { useEffect, useRef } from 'react';
import useCompositorStore from '../store/compositorStore';

export function useAutoHistory() {
  const project = useCompositorStore((state) => state.project);
  const pushHistory = useCompositorStore((state) => state.pushHistory);
  const lastProjectRef = useRef(project);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Check if project actually changed
    const projectChanged = JSON.stringify(project) !== JSON.stringify(lastProjectRef.current);

    if (projectChanged) {
      console.log('[DEBUG] Project state changed - debouncing history push...');

      // Debounce history push by 500ms
      debounceTimerRef.current = setTimeout(() => {
        console.log('[DEBUG] Pushing state to history');
        pushHistory();
        lastProjectRef.current = project;
      }, 500);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [project, pushHistory]);
}

export default useAutoHistory;
