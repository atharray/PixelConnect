import { useEffect, useRef } from 'react';
import useCompositorStore from '../store/compositorStore';
import { saveToCache, loadFromCache } from '../utils/autoSave';

const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce

export function useAutoSave() {
  const project = useCompositorStore((state) => state.project);
  const loadProject = useCompositorStore((state) => state.loadProject);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isLoadedRef = useRef(false);

  // Load from cache on mount
  useEffect(() => {
    const init = async () => {
      if (isLoadedRef.current) return;
      
      try {
        const cachedProject = await loadFromCache();
        if (cachedProject) {
          console.log('[AutoSave] Restoring cached project...');
          loadProject(cachedProject);
        }
      } catch (error) {
        console.error('[AutoSave] Failed to restore project:', error);
      } finally {
        isLoadedRef.current = true;
      }
    };
    
    init();
  }, [loadProject]);

  // Save to cache when project changes
  useEffect(() => {
    if (!isLoadedRef.current) return; // Don't save before initial load attempt
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // console.log('[AutoSave] Saving project to cache...');
      saveToCache(project);
    }, AUTO_SAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project]);
}
