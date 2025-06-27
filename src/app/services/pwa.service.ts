import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  public installationAvailable = false;

  private _deferredPrompt: PwaServiceTypes.DeferredPrompt | null = null;

  public attachInstallHandler() {
    window.arclightLogger.logInfo('Attaching PWA installer');
    this.installationAvailable = false;
    this.addNewInstallPrompt();
    window.addEventListener('appinstalled', () => {
      // Hide the app-provided install promotion
      this.installationAvailable = false;
      // Clear the deferredPrompt so it can be garbage collected
      this._deferredPrompt = null;
      // Show something to indicate success
      window.arclightLogger.logInfo('Installed as PWA');
    });
  }

  public async runInstallHandler() {
    window.arclightLogger.logInfo(`Installation available: ${ this.installationAvailable}`);
    if (this.installationAvailable && this._deferredPrompt !== null) {
      // Show the install prompt
      window.arclightLogger.logInfo(`Deferred prompt: ${ (!!this._deferredPrompt)}`);
      await this._deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await this._deferredPrompt.userChoice;
      window.arclightLogger.logInfo(`User response to the install prompt: ${outcome}`);
      // We've used the prompt, and can't use it again, throw it away
      this._deferredPrompt = null;
      // reattach for another go if necessary
      window.arclightLogger.logInfo('Reattach installer');
      this.addNewInstallPrompt();
    }
  }

  public getPWADisplayMode(): string {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (document.referrer.startsWith('android-app://')) {
      return 'twa';
    } else if (isStandalone || ('standalone' in window.navigator && window.navigator.standalone)) {
      return 'standalone';
    }
    return 'browser';
  }

  private addNewInstallPrompt() {
    window.addEventListener(
      'beforeinstallprompt',
      (e: Event) => {
        window.arclightLogger.logInfo('PWA Installer has been injected');
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later.
        this._deferredPrompt = e as unknown as PwaServiceTypes.DeferredPrompt;
        // Update UI notify the user they can install the PWA
        this.installationAvailable = true;
      },
      { once: true }
    );
  }
}

// Thanks to:
// https://web.dev/customize-install/

export namespace PwaServiceTypes {
  // Type for BeforeInstallPromptEvent (not in standard TypeScript DOM lib)
  export interface DeferredPrompt {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }
}
