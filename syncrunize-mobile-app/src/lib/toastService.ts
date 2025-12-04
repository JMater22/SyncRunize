import { toastController } from '@ionic/react';

/**
 * Global toast service for showing notifications from anywhere in the app
 * Useful for showing auth errors, network issues, etc. during mobile testing
 */
export class ToastService {
  private static async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'primary' = 'primary',
    duration: number = 3000
  ) {
    const toast = await toastController.create({
      message,
      duration,
      color,
      position: 'top',
      cssClass: 'custom-toast',
    });
    await toast.present();
  }

  static success(message: string, duration = 3000) {
    return this.showToast(message, 'success', duration);
  }

  static warning(message: string, duration = 3000) {
    return this.showToast(message, 'warning', duration);
  }

  static error(message: string, duration = 4000) {
    return this.showToast(message, 'danger', duration);
  }

  static info(message: string, duration = 3000) {
    return this.showToast(message, 'primary', duration);
  }
}
