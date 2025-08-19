import { Component, EventEmitter, Input, Output, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-uploader.component.html',
  styleUrls: ['./image-uploader.component.scss']
})
export class ImageUploaderComponent implements OnDestroy {
  @Input() existingUrl: string | null = null;

  @Input() maxSizeMB = 5;

  @Input() accept = 'image/png,image/jpeg,image/webp,image/gif';

  @Input() disabled = false;

  @Input() label = 'Upload image';

  @Input() emitOnSelect = true;

  @Output() fileChange = new EventEmitter<File>();

  @Output() upload = new EventEmitter<File>();

  @Output() cleared = new EventEmitter<void>();

  @Output() error = new EventEmitter<string>();

  dragOver = signal(false);
  private objectUrl: string | null = null;

  previewUrl = signal<string | null>(null);
  hasSelection = signal(false);
  selectedFile: File | null = null;

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }

  onBrowse(input: HTMLInputElement) {
    if (this.disabled) return;
    input.click();
  }

  onFileInput(event: Event) {
    if (this.disabled) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) this.handleFile(file);
    input.value = '';
    }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (this.disabled) return;
    this.dragOver.set(false);

    const file = event.dataTransfer?.files?.[0] || null;
    if (file) this.handleFile(file);
  }

  onDragOver(event: DragEvent) {
    if (this.disabled) return;
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave() {
    this.dragOver.set(false);
  }

  triggerUpload() {
    if (this.disabled || !this.selectedFile) return;
    this.upload.emit(this.selectedFile);
  }

  clear() {
    if (this.disabled) return;
    this.selectedFile = null;
    this.hasSelection.set(false);
    this.setPreview(null);
    this.cleared.emit();
  }

  private handleFile(file: File) {
    const err = this.validate(file);
    if (err) {
      this.error.emit(err);
      return;
    }
    this.selectedFile = file;
    this.hasSelection.set(true);
    this.setPreview(file);

    if (this.emitOnSelect) {
      this.fileChange.emit(file);
    }
  }

  private validate(file: File): string | null {
    const okType = this.accept.split(',')
      .map(s => s.trim().toLowerCase())
      .some(allowed => {
        if (!allowed) return false;
        if (allowed.startsWith('.')) {
          return file.name.toLowerCase().endsWith(allowed);
        }
        return file.type.toLowerCase() === allowed || (allowed === 'image/*' && file.type.startsWith('image/'));
      });

    if (!okType) return 'Unsupported file type. Please choose a valid image.';

    const maxBytes = this.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) return `Image is too large. Max ${this.maxSizeMB} MB.`;

    return null;
  }

  private setPreview(file: File | null) {
    this.revokeObjectUrl();
    if (file) {
      this.objectUrl = URL.createObjectURL(file);
      this.previewUrl.set(this.objectUrl);
    } else {
      this.previewUrl.set(this.existingUrl || null);
    }
  }

  private revokeObjectUrl() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
