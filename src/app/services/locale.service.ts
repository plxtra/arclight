import { Injectable } from "@angular/core";
import { all } from 'locale-codes';
import { CultureViewModel } from "../shared/models/view/culture.viewmodel";

@Injectable({
  providedIn: "root"
})
export class LocaleService {
  private _cultures: CultureViewModel[] = [];

  constructor() {
    this._cultures = all.map(l => CultureViewModel.newFromRec(l)).sort((a, b) => a.sortField.localeCompare(b.sortField));
  }

  public get cultures(): CultureViewModel[] {
    return this._cultures;
  }

  public findByTag(tag: string): CultureViewModel | undefined {
    const idx = this._cultures.findIndex(c => c.tag === tag);
    if (idx === -1) return undefined;
    return this._cultures[idx];
  }
}
