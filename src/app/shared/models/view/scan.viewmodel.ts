import { Scan } from "@plxtra/motif-core";
import { BundledService } from "src/app/services/bundled.service";
import { BaseViewModel } from "./base.viewmodel";

export class ScanViewModel extends BaseViewModel {
  public id: string;
  public name: string;
  public description: string;
  public version: string | undefined;
  public lastUpdated: string | undefined;

  static newFromDI(scan: Scan, bundledSvc: BundledService): ScanViewModel {
    const model = new ScanViewModel(bundledSvc);
    model.loadFromDI(scan);
    return model;
  }

  private loadFromDI(scan: Scan) {
    this.id = scan.id;
    this.name = scan.name;
    this.description = scan.description ?? '';
    this.version = scan.versionId;
    this.lastUpdated = scan.lastSavedTime?.toLocaleDateString();
  }
}
