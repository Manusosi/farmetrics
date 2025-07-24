import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that triggers a callback when navigating to the current page
 * Useful for refreshing data when returning to a page
 */
export function useNavigationRefresh(callback: () => void, dependencies: any[] = []) {
  const location = useLocation();
  const isInitialRender = useRef(true);

  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Call the callback when navigating to this page
    callback();
  }, [location.pathname, ...dependencies]);

  // Also call on initial load
  useEffect(() => {
    callback();
  }, []);
} 