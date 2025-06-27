import { ErrorHandler, Injectable } from "@angular/core";
import { ToastController } from '@ionic/angular/standalone';
import { InternalError } from '@pbkware/js-utils';
import { Subject, distinctUntilChanged } from "rxjs";
import { LogService } from './log-service';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly _errorSubject: Subject<string>;
  private readonly NOERROR = 'NOERROR';

  constructor(
    private readonly _logService: LogService,
    toastController: ToastController,
  ) {
    this._errorSubject = new Subject<string>();
    this._errorSubject.pipe(distinctUntilChanged())
      .subscribe(errMsg => {
        if (errMsg !== this.NOERROR) {
          const toastAndDismissPromise = this.toastAndDismissError(toastController, errMsg, this._errorSubject);
          toastAndDismissPromise.catch((reason: unknown) => {
            // If the toast fails, log the error but do not propagate it further
            this._logService.error(`Error displaying toast: ${String(reason)}`);
          });
        }
      }
    );
  }

  public handleError(error: unknown) {
    let msg: string;
    let doLog = true;
    switch (typeof error) {
      case 'string':
        msg = error;
        break;
      case 'object':
        if (error === null) {
          msg = '<null>';
        } else {
          if (!(error instanceof Error)) {
            msg = `Unknown error object: ${JSON.stringify(error)}`;
          } else {
            msg = error.message;
            if (error instanceof InternalError) {
              doLog = false;
            }
          }
        }
        break;
      default:
        msg = `Unknown error type: ${String(error)}`;
    }

    if (doLog) {
      this._logService.error(msg);
    }
    this._errorSubject.next(msg);
  }

  private async toastAndDismissError(
    toastController: ToastController,
    errMsg: string,
    errorSubject: Subject<string>,
  ): Promise<void> {
    const toast = await toastController.create({
      header: "ERROR:",
      message: errMsg,
      icon: 'bug',
      color: 'danger',
      cssClass: 'error-toast',
      buttons: [
        { text: "Dismiss", role: 'cancel' },
      ]
    });

    await toast.present();
    await toast.onDidDismiss();
    // Display any new errors that occur after dismissing
    errorSubject.next(this.NOERROR);
  }

  // private getErrorMessageLines(error: any): string[] {
  //   let msg = [];
  //   if (error.promise)
  //     if (error.rejection)
  //       msg.push(this.getErrorMessageLines(error.rejection))
  //     else
  //       msg.push(error.toString());
  //   else if (error.statusCode && error.url && error.reason)
  //     msg.push(`${error.reason} (${error.statusCode}) ${error.url}`)
  //   else if (error.status && error.url && error.statusText)
  //     msg.push(`${error.statusText} (${error.status}) - ${error.url}`)
  //   else
  //     msg.push(error.message ? error.message : error.toString());
  //   if (!navigator.onLine) {
  //     msg.push('No Internet Connection');
  //   }
  //   return msg;
  // }
}

// Thanks:
// https://betterprogramming.pub/serializing-error-in-javascript-27c3a048dc3b
