import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCol, IonLabel, IonRow, IonSkeletonText, IonText } from '@ionic/angular/standalone';
import { ScanDataModel } from 'src/app/shared/models/data/scan.datamodel';
import { BooleanDisplayComponent } from '../boolean-display/boolean-display.component';

@Component({
  selector: 'app-scan-summary',
  templateUrl: './scan-summary.component.html',
  styleUrls: ['./scan-summary.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonRow,
    IonCol,
    IonLabel,
    IonText,
    IonSkeletonText,
    BooleanDisplayComponent
  ],
})
export class ScanSummaryComponent {

  @Input()
  public model: ScanDataModel;

  @Input()
  public complete = true;
}
