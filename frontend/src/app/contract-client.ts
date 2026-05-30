import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppRuntimeConfigClient } from './app-runtime-config-client';
import { Contract } from './core/contract';

@Injectable({
  providedIn: 'root',
})
export class ContractClient {
  private http = inject(HttpClient);
  private readonly runtimeConfigClient = inject(AppRuntimeConfigClient);

  private get baseUrl(): string {
    return this.runtimeConfigClient.apiBaseUrl();
  }

  /**
   * Fetches all contracts
   */
  getAll(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.baseUrl}/contracts`);
  }

  /**
   * Fetches specific contract structural details including body text by ID
   */
  getById(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/contracts/${id}`);
  }

  /**
   * Uploads a raw .txt contract file to the backend
   * @param file The text file selected by the user
   */
  upload(file: File): Observable<any> {
    const formData = new FormData();
    // Appending the file as a blob payload matching standard multi-part data expectations
    formData.append('file', file, file.name);

    return this.http.post(`${this.baseUrl}/contracts`, formData);
  }
}