export class SelectableEntry<T> {
  public entry: T;
  public checked: boolean;

  constructor(entry: T, checked: boolean) {
    this.entry = entry;
    this.checked = checked;
  }
}
