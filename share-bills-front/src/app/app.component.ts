import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ButtonComponent } from './shared/components/button/button.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { InputFieldComponent } from './shared/components/input-field/input-field.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [ButtonComponent, InputFieldComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'share-bills-front';

  onClick(){
    console.log('Button clicked!');
  }

  submited = signal(false);
  onSubmit() {
    this.submited.set(true);
    console.log('Form submitted!');
  }
}
