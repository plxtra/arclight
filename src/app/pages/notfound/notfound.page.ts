
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { IonRouterLink } from '@ionic/angular/standalone';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.page.html',
  styleUrls: ['./notfound.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonRouterLink,
    IonicModule
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NotfoundPageComponent {

}
