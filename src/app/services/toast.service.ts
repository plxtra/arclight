import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { AssertInternalError, UnreachableCaseError } from '@pbkware/js-utils';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toastController: ToastController;

  constructor(toastController: ToastController) {
    this._toastController = toastController;
  }

  async asyncShowToast(message: string, duration = 2000): Promise<void> {
    const toast = await this._toastController.create({
      message: message,
      duration: duration,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  showToast(message: string, duration = 2000, icon?: string, color?: string, errorHandlingType = ToastService.ErrorHandlingType.Console): void {
    const toastControllerPromise = this._toastController.create({
      message,
      duration,
      icon,
      color,
    });

    toastControllerPromise.then(
      (toast) => {
        const presentPromise = toast.present();
        presentPromise.then(
          () => { /* ignore */ },
          (reason: unknown) => {
            this.processError(reason, errorHandlingType, 'TSSHP40408', message);
          }
        );
      },
      (reason: unknown) => {
        this.processError(reason, errorHandlingType, 'TSSHC40408', message);
      }
    );
  }

  private processError(reason: unknown, errorHandlingType: ToastService.ErrorHandlingType, code: string, message: string): void {
    switch (errorHandlingType) {
      case ToastService.ErrorHandlingType.None:
        break;
      case ToastService.ErrorHandlingType.Console:
        console.error(`Toast error: ${String(reason)} [${message}]`);
        break;
      case ToastService.ErrorHandlingType.Throw:
        throw AssertInternalError.createIfNotError(reason, code);
      case ToastService.ErrorHandlingType.ConsoleAndThrow:
        console.error(`Toast error: ${String(reason)} [${message}]`);
        throw AssertInternalError.createIfNotError(reason, code);
      default:
        throw new UnreachableCaseError('TSPE40409', errorHandlingType);
    }
  }
}

export namespace ToastService {
  export const enum ErrorHandlingType {
    None,
    Console,
    Throw,
    ConsoleAndThrow,
  }
}
