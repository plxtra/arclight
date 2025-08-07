import { APP_ID, enableProdMode, ErrorHandler, importProvidersFrom, inject, provideAppInitializer } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading, withRouterConfig } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';
import { IonicRouteStrategy, provideIonicAngular, ToastController } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';
import { addIcons } from 'ionicons';
import { refreshCircle } from 'ionicons/icons';
import { AppComponent } from './app/app.component';
import { routes } from './app/routes';
import { ConfigurationService } from './app/services/configuration.service';
import { DeviceInformationService } from './app/services/device-information.service';
import { GlobalErrorHandler } from './app/services/global-error-handler.service';
import { LogService } from './app/services/log-service';
import { PwaService } from './app/services/pwa.service';
import { environment } from './environments/environment';

export function getBaseUrl() {
  return document.getElementsByTagName('base')[0].href;
}

// const providers = [
//   { provide: 'BASE_URL', useFactory: getBaseUrl }
// ];

if (environment.prodMode) {
  enableProdMode();
}

// platformBrowserDynamic(providers).bootstrapModule(AppModule)
//   .catch(err => console.error("Bootstrap failed"));

addIcons({ refreshCircle });

const bootstrapPromise = bootstrapApplication(
  AppComponent,
  {
    providers: [
      { provide: DeviceInformationService.BASE_URL, useFactory: getBaseUrl },
      { provide: APP_ID,  useValue: 'ng-cli-universal' }, // probably not needed https://stackoverflow.com/questions/76452844/angular-universal-browsermodule-withservertransition-is-deprecated-what-is-the
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(
        routes,
        withRouterConfig({ paramsInheritanceStrategy: 'always' }),
        withPreloading(PreloadAllModules),
      ),
      { provide: ErrorHandler, useClass: GlobalErrorHandler, deps: [LogService, ToastController] },
      // provideHttpClient(withInterceptorsFromDi()),
      provideAppInitializer(() => {
        const initializerFn = (initializeApp)(inject(ConfigurationService), inject(PwaService), inject(DeviceInformationService));
        return initializerFn();
      }),
      importProvidersFrom(FormsModule),
      importProvidersFrom(IonicStorageModule.forRoot()),
      importProvidersFrom(
        ServiceWorkerModule.register('ngsw-worker.js', {
          enabled: environment.prodMode,
          // enabled: true, // For debugging - be aware of reloading issues
          registrationStrategy: 'registerImmediately'
        }),
      ),
    ]
  },
);

bootstrapPromise.catch((e: unknown) => console.error(e));

function initializeApp(
  configurationService: ConfigurationService,
  pwaService: PwaService,
  deviceInfoService: DeviceInformationService
) {
  return async () => {
    pwaService.attachInstallHandler();
    window.arclightLogger.logInfo(`PWA running in mode: ${pwaService.getPWADisplayMode()}`);
    // await Promise.all([configurationService.load(), deviceInfoService.load()]);
    await configurationService.load();
  }
}
