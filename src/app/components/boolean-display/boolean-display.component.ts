import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkbox, squareOutline } from 'ionicons/icons';

@Component({
  selector: 'app-boolean-display',
  templateUrl: './boolean-display.component.html',
  styleUrls: ['./boolean-display.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonIcon
  ],
})
export class BooleanDisplayComponent {

  @Input()
  public value: boolean;

  private _color = 'primary';

  constructor() {
    addIcons({
      checkbox,
      squareOutline,
    });
  }

  @Input()
  public set color(v : string) {
    if (v && v !== "") this._color = v;
  }

  public get color() : string {
    return this._color;
  }
}
