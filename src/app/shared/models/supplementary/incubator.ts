import { DataDefinition, DataItem, DataItemIncubator } from "@plxtra/motif-core";
import { UnifyService } from "src/app/services/unify.service";

export class Incubator<TDI extends DataItem> {
  private readonly _unifySvc: UnifyService;
  private readonly _dataDefinition: DataDefinition;
  private readonly _incubator: DataItemIncubator<TDI>;

  constructor(
    unifySvc: UnifyService,
    dataDefinition: DataDefinition,
  ) {
    this._unifySvc = unifySvc;
    this._dataDefinition = dataDefinition;
    this._incubator = new DataItemIncubator(this._unifySvc.adi);
  }

  public finalise() {
    this._incubator.finalise();
  }

  public incubate(): Promise<TDI | undefined> {
    let di: TDI;
    const rdi = this._incubator.incubateSubcribe(this._dataDefinition);
    if (DataItemIncubator.isDataItem(rdi)) {
      di = rdi;
      return new Promise<TDI>(() => di);
    } else {
      return rdi;
    }
  }
}
