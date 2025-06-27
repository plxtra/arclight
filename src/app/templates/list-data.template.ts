import { Directive } from "@angular/core";

@Directive()
export abstract class ListDataTemplateDirective<TViewModel> {
  protected _dataAvailable = false;
  protected _viewData: TViewModel[] = [];
  protected _filteredViewData: TViewModel[] = [];
  protected _searchText= "";

  public get viewData(): TViewModel[] | null{
    if (this.dataAvailable) {
      if (this.isViewDataFiltered) {
        return this._filteredViewData;
      } else {
        return this._viewData;
      }
    } else {
      return null;
    }
  }

  public get searchText(): string {
    return this._searchText;
  }
  public set searchText(v: string) {
    if (this._searchText !== v) {
      this._searchText = v;
      if (this.isViewDataFiltered) {
        this._filteredViewData = this._viewData.filter((model) => this.resolveFilterLambda(model));
      }
    }
  }

  public get isViewDataFiltered(): boolean {
    return (this._searchText.length > 0);
  }

  public get unfilteredCount(): number {
    return this._viewData.length;
  }

  public get filteredCount(): number {
    return this._filteredViewData.length;
  }

  public get dataAvailable(): boolean {
    return this._dataAvailable;
  }
  protected set dataAvailable(v: boolean) {
    this._dataAvailable = v;
  }

  protected abstract resolveFilterLambda(model: TViewModel): boolean;
}
