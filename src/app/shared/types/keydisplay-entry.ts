export class KeyDisplayEntry<T> {
  public key: T;
  public display: string;

  constructor(key: T, display: string) {
    this.key = key;
    this.display = display;
  }
}
