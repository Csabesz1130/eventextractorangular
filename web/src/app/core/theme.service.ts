import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  get isDark() { return this._dark; }

  toggle() {
    this._dark = !this._dark;
    document.documentElement.classList.toggle('dark', this._dark);
  }

  init() {
    document.documentElement.classList.toggle('dark', this._dark);
  }
}

