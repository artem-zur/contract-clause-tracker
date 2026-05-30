import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppRuntimeConfigClient } from './app-runtime-config-client';

export enum ClauseTypeCode {
  LimitationOfLiability = 'LIMITATION_OF_LIABILITY',
  TerminationForConvenience = 'TERMINATION_FOR_CONVENIENCE',
  NonCompete = 'NON_COMPETE'
}

export interface ClauseType {
  id: string;
  name: string;
  code: ClauseTypeCode;
}

export interface Clause {
  id: string;
  contractId: string;     
  clauseTypeId: string;   
  startIndex: number;     
  endIndex: number;       
  textSnippet: string;    
  clauseType?: ClauseType;
}

export interface Contract {
  id: string;
  title: string;
  text: string;
  clauses: Clause[];
}

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