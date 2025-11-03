import { useEffect } from 'react';

export const useHideTabBar = () => {
  useEffect(() => {
    // Function to hide the tab bar
    const hideTabBar = () => {
      const tabBar = document.querySelector('ion-tab-bar');
      if (tabBar) {
        (tabBar as HTMLElement).style.display = 'none';
      }
    };

    // Hide immediately
    hideTabBar();

    // Use MutationObserver to handle dynamic DOM changes
    const observer = new MutationObserver(() => {
      hideTabBar();
    });

    // Observe the body for any DOM changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup function - restore tab bar immediately
    return () => {
      observer.disconnect();
      
      const tabBar = document.querySelector('ion-tab-bar');
      if (tabBar) {
        (tabBar as HTMLElement).style.display = 'flex';
      }
    };
  }, []);
};