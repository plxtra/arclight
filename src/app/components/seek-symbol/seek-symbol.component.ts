import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  SearchbarCustomEvent,
} from '@ionic/angular/standalone';
import { AssertInternalError, Logger } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { close, eye, eyeOff } from 'ionicons/icons';

@Component({
  selector: 'app-seek-symbol',
  templateUrl: './seek-symbol.component.html',
  styleUrls: ['./seek-symbol.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonItem,
    IonSearchbar,
    IonCard,
    IonCardContent,
    IonRow,
    IonCol,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonContent
  ],
})
export class SeekSymbolComponent {

  @ViewChild("symbolSearchbar")
  searchBar: IonSearchbar;

  private _selected: string;
  private _isOpen = false;
  private _showingOptions  = false;

  constructor() {
    addIcons({
      close,
      eye,
      eyeOff,
    });
  }

  public get selected(): string {
    return this._selected;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  public get showingOptions() : boolean {
    return this._showingOptions;
  }

  searchWasPresented() {
    const setFocusPromise = this.searchBar.setFocus();
    AssertInternalError.throwErrorIfPromiseRejected(setFocusPromise, 'SSCSWP04184');
  }

  public open() {
    this._isOpen = true;
    this._showingOptions = false;
  }

  public cancel() {
    this._isOpen = false;
  }

  public select() {
    this._isOpen = false;
  }

  public toggleOptionsDisplay() {
    this._showingOptions = !this._showingOptions;
  }

  public onSearchInput(evnt: SearchbarCustomEvent) {
    window.arclightLogger.log(Logger.LevelId.Info, `input changed ${evnt.detail.value}`);
  }
}

// Thanks:
// https://www.youtube.com/watch?v=bbENzQvJjJo
