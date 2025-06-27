import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-connection-retry-modal',
  templateUrl: './connection-retry-modal.component.html',
  styleUrls: ['./connection-retry-modal.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ConnectionRetryModalComponent {

}
