
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonSpinner, ViewDidEnter } from '@ionic/angular/standalone';
import { getErrorMessage } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { refreshCircle } from 'ionicons/icons';
import { OpenIdService } from '../../services/open-id-service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-authentication-callback',
  templateUrl: './auth-callback.page.html',
  styleUrls: ['./auth-callback.page.scss'],
  imports: [
    FormsModule,
    IonButton,
    IonIcon,
    IonSpinner
  ],
})
export class AuthCallbackPageComponent implements ViewDidEnter {
  private readonly _toastService = inject(ToastService);
  private readonly _openIdService = inject(OpenIdService);

  constructor() {
    addIcons({
      refreshCircle,
    });
  }

  ionViewDidEnter() {
    const authenticationPromise = this._openIdService.completeAuthentication();
    authenticationPromise.then(
      () => { /* */ },
      (reason: unknown) => {
        this._toastService.showToast(`Authentication failed: ${getErrorMessage(reason)}`, 2000, 'alert-circle', 'danger');
        console.error('Authentication failed:', reason);
      }
    );
  }
}
