import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { AssertInternalError } from '@pbkware/js-utils';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  public static LastKnownColourScheme = "LastKnownColourScheme";
  public static PreloadStocks = "PreloadStocks";

  private _dataStore: Storage | undefined;
  private _dataStoreCreatedResolveFtns: LocalStorageService.DataStoreCreatedResolveFtn[] | undefined;
  private readonly _srcStorage: Storage;

  constructor(storage: Storage) {
    this._srcStorage = storage;
  }

  public async set(key: string, value: unknown) {
    window.arclightLogger.logDebug(`LOCAL: set - ${key}, ${JSON.stringify(value)}`);
    const dataStore = await this.getDataStore();
    await dataStore.set(key, value);
  }

  public async get(key: string): Promise<unknown> {
    const dataStore = await this.getDataStore();
    const value = await dataStore.get(key) as unknown;
    window.arclightLogger.logDebug(`LOCAL: get - ${key}, ${JSON.stringify(value)}`);
    return value;
  }

  public async clear() {
    if (this._dataStore) {
      await this._dataStore.clear();
      window.arclightLogger.logDebug('LOCAL: clear');
    }
  }

  public async clearForUser(keyPrefix: string) {
    if (this._dataStore) {
      const foundKeys: string[] = [];
      await this._dataStore.forEach((v, k) => { if (k.startsWith(keyPrefix)) foundKeys.push(k); });
      for (const key of foundKeys) {
        await this._dataStore.remove(key);
      }
    }
  }

  private getDataStore(): Promise<Storage> {
    if (this._dataStore !== undefined) {
      return Promise.resolve(this._dataStore);
    } else {
      if (this._dataStoreCreatedResolveFtns === undefined) {
        this._dataStoreCreatedResolveFtns = [];
      }
      const dataStoreCreatedResolveFtns = this._dataStoreCreatedResolveFtns;

      const createPromise = this._srcStorage.create();
      createPromise.then(
        (storage) => {
          this._dataStore = storage;
          this._dataStoreCreatedResolveFtns = undefined;
          for (const ftn of dataStoreCreatedResolveFtns) {
            ftn(storage);
          }
        },
        (reason: unknown) => { throw AssertInternalError.createIfNotError(reason, 'LSSGDS44881'); }
      );

      return new Promise<Storage>((resolve) => dataStoreCreatedResolveFtns.push(resolve));
    }
  }
}

export namespace LocalStorageService {
  export type DataStoreCreatedResolveFtn = (dataStore: Storage) => void;
}

// Thanks: https://bytearcher.com/articles/asynchronous-call-in-constructor/
