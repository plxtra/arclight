export interface IDeviceInfo {
  readonly isBot: boolean;

  readonly deviceName: string;
  readonly deviceBrand: string;
  readonly deviceShortBrand: string;
  readonly deviceModel: string;

  readonly clientType: string;
  readonly clientName: string;
  readonly clientVersion: string;

  readonly osName: string;
  readonly osShortName: string;
  readonly osVersion: string;
  readonly osPlatform: string;
  readonly osFamily: string;

  readonly browserName: string;
  readonly browserEngine: string;
  readonly browserEngineVersion: string;
  readonly browserFamily: string;
}
