import { useEffect } from 'react';

export const useHideTabBar = () => {
  useEffect(() => {
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      (tabBar as HTMLElement).style.display = 'none';
    }

    return () => {
      const tabBar = document.querySelector('ion-tab-bar');
      if (tabBar) {
        (tabBar as HTMLElement).style.display = 'flex';
      }
    };
  }, []);
};