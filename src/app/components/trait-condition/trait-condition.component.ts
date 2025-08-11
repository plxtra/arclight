import { ScrollingModule } from '@angular/cdk/scrolling';

import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonCol, IonIcon, IonInput, IonItem, IonRow, IonSelect, IonSelectOption } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { TraitStyle } from 'src/app/shared/models/scans/trait-style.type';
import { SelectOptionModel } from 'src/app/shared/models/site/select-option.model';

@Component({
  selector: 'app-trait-condition',
  templateUrl: './trait-condition.component.html',
  styleUrls: ['./trait-condition.component.scss'],
  imports: [
    FormsModule,
    ScrollingModule,
    IonRow,
    IonCol,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonInput,
  ],
})
export class TraitConditionComponent implements OnInit {
  @Input()
  public style: TraitStyle;

  public readonly logicExists = "exists";
  public readonly logicIs = "is";
  public readonly logicIsNot = "isnot";
  public readonly logicBetween = "between";
  public readonly logicMoreThan = "morethan";
  public readonly logicLessThan = "lessthan";
  public readonly logicMoreThanOrEqual = "morethanequal";
  public readonly logicLessThanOrEqual = "lessthanequal";

  private _availableLogics: SelectOptionModel[] = [];

  private _comparisonType = "text";
  private _comparisonValues: string[] = [];
  private _selectedLogic: string;

  constructor() {
    this.selectedLogic = this.logicIs;

    addIcons({
      close,
    });
  }

  public get availableLogics(): SelectOptionModel[] {
    return this._availableLogics;
  }

  public get comparisonType(): string {
    return this._comparisonType;
  }

  public get comparisonValues(): string[] {
    return this._comparisonValues;
  }

  public get selectedLogic(): string {
    return this._selectedLogic;
  }
  public set selectedLogic(v: string) {
    this._selectedLogic = v;
    switch (this._selectedLogic) {
      case this.logicExists:
        this.resize(0);
        break;
      case this.logicIs:
      case this.logicIsNot:
      case this.logicMoreThan:
      case this.logicLessThan:
      case this.logicMoreThanOrEqual:
      case this.logicLessThanOrEqual:
        this.resize(1);
        break;
      case this.logicBetween:
        this.resize(2);
        break;
      default:
        this.resize(0);
    }
  }

  ngOnInit() {
    this.updateAvailableLogics();
  }

  private updateAvailableLogics() {
    this._availableLogics.push({ value: this.logicExists, description: "Exists" });
    this._availableLogics.push({ value: this.logicIs, description: "Is" });
    this._availableLogics.push({ value: this.logicIsNot, description: "Is not" });
    this._availableLogics.push({ value: this.logicBetween, description: "Between" });
    this._availableLogics.push({ value: this.logicMoreThan, description: "More than" });
    this._availableLogics.push({ value: this.logicLessThan, description: "Less than" });
    this._availableLogics.push({ value: this.logicLessThanOrEqual, description: "No more than" });
    this._availableLogics.push({ value: this.logicMoreThanOrEqual, description: "No less than" });


    switch (this.style) {
      case "BooleanSingleDefault":
      case "DateNamedRange":
      case "DateRange":
      case "NamedText":
      case "Text":
      case "TextMultiple":
      case "TextSingle":
      case "TextSingleExists":
        this._comparisonType = "text";
        break;
      case "NumericNamedRange":
      case "NumericRange":
        this._comparisonType = "number";
        break;
    }
  }

  private resize(newSize: number) {
    if (newSize > this._comparisonValues.length)
      while (newSize > this._comparisonValues.length)
        this._comparisonValues.push("");
    else
      this._comparisonValues.length = newSize;
  }
}
