import "server-only";

export type StoredAttachment = {
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  checksum: string | null;
  contentBase64: string;
};

export interface AttachmentStoragePort {
  store(params: {
    conversationId: string;
    messageId: string;
    files: File[];
  }): Promise<StoredAttachment[]>;
}
