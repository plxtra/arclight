import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _systemPrefersDarkQuery: MediaQueryList;
  private _theme: ThemeName | undefined;

  constructor() {
    this._systemPrefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this._systemPrefersDarkQuery.addEventListener('change', (e) => {
      if (this.theme === "system") {
        this.setDarkTheme(e.matches)
      }
    });
  }

  public set theme(val: ThemeName | undefined) {
    if (!val) val = ThemeName.defaultTheme;
    if (this._theme !== val) {
      this._theme = val;
      switch (this._theme) {
        case "light":
          this.setDarkTheme(false);
          break;
        case "dark":
          this.setDarkTheme(true);
          break;
        case "system":
          this.setDarkTheme(this.systemIsDarkTheme);
          break;
      }
    }
  }

  public get theme(): ThemeName | undefined {
    return this._theme;
  }

  private get systemIsDarkTheme(): boolean {
    return this._systemPrefersDarkQuery.matches;
  }

  setDarkTheme(isDark: boolean) {
    document.body.classList.toggle('dark', isDark);
  }

  queryDarkTheme(): boolean {
    switch (this._theme) {
      case "light":
        return false;
      case "dark":
        return true;
        break;
      case "system":
      case undefined:
        return this.systemIsDarkTheme;
    }
  }
}

export type ThemeName = "light" | "dark" | "system";

export namespace ThemeName {
  export const defaultTheme: ThemeName = "system";
  export const lightTheme: ThemeName = "light";
  export const darkTheme: ThemeName = "dark";
  export const systemTheme: ThemeName = "system";

  export function isValidTheme(theme: string): theme is ThemeName {
    return (theme === "light" || theme === "dark" || theme === "system");
  }
}
