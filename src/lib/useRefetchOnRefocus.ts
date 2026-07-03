import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Re-runs `refetch` whenever the screen REGAINS focus — returning to a tab
 * after a pushed screen (a finished money date, an advanced journey stage)
 * pops back. The initial focus is skipped: the owning hook's mount fetch
 * already covers it, so no double fetch and no skeleton flash on first render.
 *
 * expo-router's useFocusEffect is the navigation-aware idiom here — a plain
 * useEffect never re-fires when navigating back, because tab screens stay
 * mounted behind pushed routes.
 */
export function useRefetchOnRefocus(refetch: () => void): void {
  const hasFocusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnce.current) {
        hasFocusedOnce.current = true;
        return;
      }
      refetch();
    }, [refetch])
  );
}
