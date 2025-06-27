import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trash } from 'ionicons/icons';

@Component({
  selector: 'app-confirm-delete',
  templateUrl: './confirm-delete.component.html',
  styleUrls: ['./confirm-delete.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonicModule
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
