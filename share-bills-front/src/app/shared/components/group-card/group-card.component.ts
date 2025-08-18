import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';

@Component({
  selector: 'app-group-card',
  imports: [],
  templateUrl: './group-card.component.html',
  styleUrl: './group-card.component.scss',
})
export class GroupCardComponent {
  @Input({ required: true }) group!: GroupBaseDto;

  /** Pass currently logged-in user id from parent (e.g. from store). */
  @Input() currentUserId?: number;

  /** Emits the conversation.job.id on click */
  @Output() open = new EventEmitter<number>();

  get partyName() {
    if (!this.group) return '';
    const sender = this.group.name;
    return sender ?? '';
  }

  // get time(): string {
  //   const d = new Date(this.conversation?.updated_at);
  //   // Same as toLocaleTimeString in React (kept default locale)
  //   return isNaN(d.getTime()) ? '' : d.toLocaleTimeString();
  // }

  handleClick(): void {
    // if (this.conversation?.job?.id != null) {
    //   this.open.emit(this.conversation.job.id);
    // }
  }
}
