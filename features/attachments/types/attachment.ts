export type AttachmentStatus = "uploaded" | "reused" | "failed";

export type AttachmentDto = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  status: AttachmentStatus;
  storageKey: string;
  checksum: string | null;
  createdAt: string;
};

export type PendingAttachment = {
  id: string;
  file: File;
  previewLabel: string;
};
