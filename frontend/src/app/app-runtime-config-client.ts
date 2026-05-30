import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppRuntimeConfig {
  apiBaseUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppRuntimeConfigClient {
  private readonly http = inject(HttpClient);
  
  private readonly state = signal<AppRuntimeConfig | null>(null);
  
  readonly current = this.state.asReadonly();
  readonly apiBaseUrl = computed(() => this.state()?.apiBaseUrl ?? 'http://localhost:8000');

  /**
   * Fetches the static runtime configurations from the public pipeline
   */
  load(): Promise<void> {
    return firstValueFrom(this.http.get<AppRuntimeConfig>('app-runtime.config.json'))
      .then((config) => this.state.set(config))
      .catch((error) => {
        console.error('Critical configuration failure. Relying on local fallbacks.', error);
        this.state.set({ apiBaseUrl: 'http://localhost:8000' });
      });
  }
}