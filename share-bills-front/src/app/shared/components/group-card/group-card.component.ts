import { NgIf } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface GroupBaseDto {
  id: number;
  name: string;
  imagePath?: string;
  ownerId?: number; // remove if not available in your base dto
}

@Component({
  selector: 'app-group-card',
  standalone: true,
  imports: [NgIf],
  templateUrl: './group-card.component.html',
  styleUrl: './group-card.component.scss',
})
export class GroupCardComponent {
  @Input({ required: true }) group!: GroupBaseDto;
  @Input() currentUserId?: number;

  @Output() open = new EventEmitter<number>();

  get partyName(): string {
    return this.group?.name ?? '';
  }

  handleClick(): void {
  if (this.group?.id != null) {
    this.open.emit(this.group.id);
  }
}

  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.handleClick();
    }
  }

  onImgError(e: Event) {
    const img = e.target as HTMLImageElement;
    img.src = 'assets/group-fallback.png';
    img.classList.add('img-fallback');
  }

  get isOwner(): boolean {
    return !!this.currentUserId && !!this.group?.ownerId && this.currentUserId === this.group.ownerId;
  }

  get initials(): string {
    const n = this.partyName.trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }
}
