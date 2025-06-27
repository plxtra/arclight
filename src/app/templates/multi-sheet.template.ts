import { Directive } from "@angular/core";
import { DataLoadingTemplateDirective } from "./data-loading.template";

@Directive()
export abstract class MultiSheetTemplateDirective extends DataLoadingTemplateDirective {

  public readonly BaseSheetNumber: number = 1;

  private _sheetNumber = 0; // initially no sheet
  public get sheetNumber(): number {
    return this._sheetNumber;
  }

  public initialSheet(sheetNumber: number) {
    this._sheetNumber = sheetNumber;
  }

  public isSheetActive(sheetNumber: number): boolean {
    return (sheetNumber === this.sheetNumber);
  }

  public nextSheet() {
    this.gotoSheet(this._sheetNumber + 1);
  }

  public priorSheet() {
    this.gotoSheet(this._sheetNumber - 1);
  }

  public firstSheet() {
    this.gotoSheet(1);
  }

  public gotoSheet(num: number) {
    const fromSheet = this._sheetNumber;
    const toSheet = num;

    this._initialised = false;
    this.sheetChanging(fromSheet, toSheet);
    this._sheetNumber = num;
    this.sheetChanged(fromSheet, toSheet);
    this.initialisationDone(`sheet: ${this._sheetNumber}`);
  }

  protected sheetChanging(_fromSheet: number, _toSheet: number) {/**/}
  protected sheetChanged(_fromSheet: number, _toSheet: number) {/**/}
}
