import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonModal,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
  ],
})
export class ConfirmDeleteComponent {

  @Input()
  public description: string;

  @Output()
  public deleteSelected: EventEmitter<unknown> = new EventEmitter<unknown>();

  private _isOpen = false;

  constructor() {
    addIcons({
      trash,
    });
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public modalWasPresented() {/**/}

  public open() {
    this._isOpen = true;
  }

  public cancel() {
    this._isOpen = false;
  }

  public select(option: boolean) {
      this._isOpen = false;
      if (option)
        this.deleteSelected.emit();
  }
}
