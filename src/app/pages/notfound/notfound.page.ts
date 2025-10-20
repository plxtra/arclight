
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonCol, IonContent, IonGrid, IonImg, IonRow, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-notfound',
  templateUrl: './notfound.page.html',
  styleUrls: ['./notfound.page.scss'],
  imports: [
    FormsModule,
    RouterLink,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonText,
    IonButton,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class NotfoundPageComponent {

}
