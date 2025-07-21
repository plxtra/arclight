import { Injectable, inject } from "@angular/core";
import { IDeviceInfo } from "../shared/models/site/device-information.model";

@Injectable({
  providedIn: 'root'
})
export class DeviceInformationService {
  private readonly _baseUrl: string;

  private _deviceInfo: IDeviceInfo = {} as IDeviceInfo;

  constructor() {
    const baseUrl = inject<string>('BASE_URL' as any);

    this._baseUrl = baseUrl;
  }

  public get deviceInfo(): IDeviceInfo {
    return this._deviceInfo;
  }

  public async load(): Promise<void> {
    const deviceDetectEndpoint = `${this._baseUrl}api/devicedetect`;

    const init = {
      credentials: "include",
      headers: new Headers({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': location.origin
      }),
      method: "POST",
      mode: "cors",
      body: window.navigator.userAgent
    } as RequestInit;

    const response = await fetch(deviceDetectEndpoint, init);
    this._deviceInfo = await response.json() as IDeviceInfo;
    window.arclightLogger.logInfo(`Device detected ${ this._deviceInfo.deviceName}`);
  }
}
