import { Component } from '@angular/core';
import { Upload } from './upload/upload';

@Component({
  selector: 'app-root',
  standalone: true,
  host: {
    class: 'block p-3'
  },
  imports: [
    Upload
  ],
  templateUrl: './app.html',
})
export class App {
}
