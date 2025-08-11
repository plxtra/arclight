import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonImg,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { AssertInternalError } from '@pbkware/js-utils';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { LocaleService } from 'src/app/services/locale.service';
import { CultureViewModel } from 'src/app/shared/models/view/culture.viewmodel';

@Component({
  selector: 'app-select-locale',
  templateUrl: './select-locale.component.html',
  styleUrls: ['./select-locale.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButton,
    IonButtons,
    IonIcon,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonImg,
    IonLabel,
    IonFooter,
    IonSearchbar,
  ],
})
export class SelectLocaleComponent implements OnInit {
  @ViewChild("localeSearchbar")
  searchBar: IonSearchbar;

  @ViewChild("viewPort")
  cdkViewPort: CdkVirtualScrollViewport | undefined;

  @Input()
  public culture: string;

  @Output()
  public selectedChanged: EventEmitter<unknown> = new EventEmitter<unknown>();

  protected _searchText = "";

  private readonly _localeSvc: LocaleService;

  private _filteredViewData: CultureViewModel[] = [];
  private _selected: CultureViewModel | undefined = undefined;
  private _isOpen = false;

  constructor() {
    const localeSvc = inject(LocaleService);

    this._localeSvc = localeSvc;

    addIcons({
      close,
    });
  }

  public get viewData(): CultureViewModel[] {
    const data = (this.isViewDataFiltered) ? this._filteredViewData : this._localeSvc.cultures;
    return data;
  }

  public get anyData(): boolean {
    return (this.viewData.length > 0);
  }

  public get searchText(): string {
    return this._searchText;
  }
  public set searchText(v: string) {
    if (this._searchText !== v) {
      this._searchText = v;
      if (this.isViewDataFiltered) {
        this._filteredViewData = this._localeSvc.cultures.filter((model) => this.filterElement(model));
        if (this.anyData && this.cdkViewPort !== undefined) {
          this.cdkViewPort.scrollToIndex(0);
        }
      }
    }
  }

  public get isViewDataFiltered(): boolean {
    return this._searchText.length > 0;
  }

  public get unfilteredCount(): number {
    return this.viewData.length;
  }

  public get filteredCount(): number {
    return this._filteredViewData.length;
  }

  public get selected(): CultureViewModel | undefined {
    return this._selected;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  ngOnInit() {
    this._selected = this._localeSvc.findByTag(this.culture);
  }

  public modalWasPresented() {
    const setFocusPromise = this.searchBar.setFocus();
    setFocusPromise.then(
      () => {
        const selected = this.selected;

        if (selected && this.cdkViewPort) {
          const idx = this.viewData.findIndex(c => c.tag === selected.tag);
          if (idx !== -1) {
            this.cdkViewPort.scrollToIndex(idx);
          }
        }
      },
      (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'SLCMWP33221'); }
    );
  }

  public open() {
    this.searchText = "";
    this._isOpen = true;
  }

  public cancel() {
    this._isOpen = false;
  }

  public select(tag: string) {
    this._selected = this._localeSvc.findByTag(tag);
    if (this.selected !== undefined) {
      this._isOpen = false;
      this.selectedChanged.emit(this.selected.tag);
    }
  }

  public isSelectedEntry(tag: string): boolean {
    return (this.selected?.tag ?? "") === tag;
  }

  private filterElement(element: CultureViewModel): boolean {
    const searchFor = this.searchText.toLocaleLowerCase();
    return element.name.toLocaleLowerCase().includes(searchFor)
      || element.location.toLocaleLowerCase().includes(searchFor)
      || element.tag.toLocaleLowerCase().includes(searchFor);
  }
}
