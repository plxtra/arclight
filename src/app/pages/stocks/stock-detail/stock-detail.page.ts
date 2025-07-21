import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenuButton,
  IonSkeletonText,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowDownCircle, arrowUpCircle, bookSharp, informationSharp, listSharp, statsChartSharp } from 'ionicons/icons';
import { OpenOrdersControlComponent } from '../../../components/open-orders-control/open-orders-control.component';
import { StockDetailBaseDirective } from './stock-detail.base';

@Component({
  selector: 'app-stock-detail',
  templateUrl: './stock-detail.page.html',
  styleUrls: ['./stock-detail.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    OpenOrdersControlComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonIcon,
    IonContent,
    IonTabs,
    IonTabBar,
    IonTabButton,
  ],
})
export class StockDetailPage extends StockDetailBaseDirective implements OnInit, OnDestroy {

  constructor() {
    super();

    addIcons({
      arrowUpCircle,
      arrowDownCircle,
      informationSharp,
      bookSharp,
      listSharp,
      statsChartSharp,
    });
  }

  public get priceIncrease(): boolean {
    return (this.securityDetail !== undefined && this.securityDetail.lastOrCloseChanged > 0);
  }

  public get priceDecrease(): boolean {
    return (this.securityDetail !== undefined && this.securityDetail.lastOrCloseChanged < 0);
  }

  public get priceChange(): boolean {
    return (this.priceIncrease || this.priceDecrease);
  }
}
