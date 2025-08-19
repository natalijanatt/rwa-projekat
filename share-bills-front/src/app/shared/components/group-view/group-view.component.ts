import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf, NgFor, NgOptimizedImage } from '@angular/common';
import { GroupFullDto } from '../../../feature/groups/data/group-full.dto';
import { GroupMemberBaseDto } from '../../../feature/groups/data/group-member-base.dto';

@Component({
  selector: 'app-group-view',
  imports: [NgIf, NgFor, NgOptimizedImage],
  templateUrl: './group-view.component.html',
  styleUrl: './group-view.component.scss',
})
export class GroupViewComponent {
  @Input() group!: GroupFullDto;

  @Output() update = new EventEmitter<GroupFullDto>();
  @Output() addExpense = new EventEmitter<number>();
  @Output() updateGroup = new EventEmitter<number>();

  onImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.src = 'assets/avatar-placeholder.webp';
  }
  onMemberImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.src = 'assets/avatar-placeholder.webp';
  }

  get membersCount(): number {
    return this.group?.members?.length ?? 0;
  }
  get members(): GroupMemberBaseDto[] {
    return this.group?.members ?? [];
  }

  trackByMemberId = (_: number, m: GroupMemberBaseDto) => m.id;

  onUpdate() {
    this.update.emit(this.group);
  }
  onAddExpense() {
    this.addExpense.emit(this.group.id);
  }
  onUpdateGroup() {
    this.updateGroup.emit(this.group.id);
  }
}
