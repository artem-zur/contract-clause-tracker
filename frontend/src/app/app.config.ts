import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { AppRuntimeConfigClient } from './app-runtime-config-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),

    // Delays application bootstrap until the configurations are fetched and set
    provideAppInitializer(() => {
      const configService = inject(AppRuntimeConfigClient);
      return configService.load();
    })
  ]
};
