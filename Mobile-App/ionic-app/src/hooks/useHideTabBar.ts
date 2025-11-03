import { useIonViewWillEnter, useIonViewWillLeave } from '@ionic/react';

export const useHideTabBar = () => {
  useIonViewWillEnter(() => {
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      (tabBar as HTMLElement).style.display = 'none';
    }
  });

  useIonViewWillLeave(() => {
    const tabBar = document.querySelector('ion-tab-bar');
    if (tabBar) {
      (tabBar as HTMLElement).style.display = 'flex';
    }
  });
};