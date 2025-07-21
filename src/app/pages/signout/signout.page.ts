
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AssertInternalError } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { refreshCircle } from 'ionicons/icons';
import { OpenIdService } from '../../services/open-id-service';

@Component({
  selector: 'app-signout',
  templateUrl: './signout.page.html',
  styleUrls: ['./signout.page.scss'],
  imports: [
    FormsModule,
    IonicModule
  ],
})
export class SignoutPageComponent implements OnInit {
  private readonly _openIdService: OpenIdService;

  constructor() {
    const openIdService = inject(OpenIdService);

    this._openIdService = openIdService;

    addIcons({
      refreshCircle,
    });
  }

  ngOnInit() {
    const signOutPromise = this._openIdService.signOut();
    AssertInternalError.throwErrorIfPromiseRejected(signOutPromise, 'SPCNOI11123');
  }
}
