import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContractClient {
  private http = inject(HttpClient);

  /**
   * Uploads a raw .txt contract file to the backend
   * @param file The text file selected by the user
   */
  upload(file: File): Observable<any> {
    const formData = new FormData();
    // Appending the file as a blob payload matching standard multi-part data expectations
    formData.append('file', file, file.name);

    return this.http.post('http://localhost:8000/contracts', formData);
  }
}