import { NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GroupBaseDto } from '../../../feature/groups/data/group-base.dto';
import { GroupCardComponent } from "../group-card/group-card.component";

@Component({
  selector: 'app-group-list',
  imports: [NgFor, GroupCardComponent],
  templateUrl: './group-list.component.html',
  styleUrl: './group-list.component.scss',
})
export class GroupListComponent {
  @Input({ required: true }) groups: GroupBaseDto[] = [];
  @Input() currentUserId?: number; // optional: pass down to cards if you like

  /** Emits jobId (same behavior as React onSelection) */
  @Output() selection = new EventEmitter<number>();

  // groups: Group[] = [];

  ngOnChanges(): void {
    const map = new Map<string, GroupBaseDto[]>();

    // for (const c of this.group ?? []) {
    //   const d = new Date(c.updated_at);
    //   const key = this.formatDateKey(d); // YYYY-MM-DD
    //   if (!map.has(key)) map.set(key, []);
    //   map.get(key)!.push(c);
    // }

    // Keep consistent order—most recent date first
    const sortedKeys = Array.from(map.keys()).sort((a, b) =>
      a < b ? 1 : a > b ? -1 : 0
    );

    // this.groups = sortedKeys.map((dateKey) => ({
    //   dateKey,
    //   displayDate: this.formatDisplayDate(dateKey),
    //   convos: map.get(dateKey)!,
    // }));
  }

  onOpen(jobId: number): void {
    this.selection.emit(jobId);
  }

  // trackGroup = (_: number, g: Group) => g.dateKey;
  // trackConvo = (_: number, c: ChatDto) => c.id;

  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDisplayDate(dateKey: string): string {
    // dateKey is YYYY-MM-DD – safe to new Date()
    const date = new Date(dateKey);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
