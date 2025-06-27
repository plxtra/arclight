import { ILocale } from "locale-codes";

export class CultureViewModel {
  public tag: string;
  public name: string;
  public location: string;
  public sortField: string;


  public static newFromRec(locale: ILocale) {
    const vm = new CultureViewModel();
    vm.loadFromRec(locale);
    return vm;
  }
  public loadFromRec(locale: ILocale) {
    this.tag = locale.tag;
    this.name = locale.name;
    this.location = locale.location ?? "General";
    this.sortField = `${locale.name}|${locale.location ?? ""}`
  }
}
