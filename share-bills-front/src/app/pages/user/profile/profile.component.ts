import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription} from 'rxjs';
import { selectUser } from '../../../core/auth/state/auth.selectors';
import { UserDto } from '../../../feature/users/data/user.dto';
import { DatePipe, NgIf, UpperCasePipe } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-profile',
  imports: [NgIf, UpperCasePipe, DatePipe, ButtonComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private store = inject(Store);
  private sub = new Subscription();
  user$ = this.store.select(selectUser); 
  user: UserDto | null = null;


  ngOnInit() {
    this.sub.add(
      this.user$.subscribe(user => this.user = user ? { ...user } : null)
    );
    if (!this.user) {
      location.assign('/login');  
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
