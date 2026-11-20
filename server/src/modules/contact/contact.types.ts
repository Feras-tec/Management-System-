export interface ContactMessageInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactStore {
  findPublicBusinessId(): Promise<string | null>;
  createMessage(
    businessId: string,
    input: ContactMessageInput,
  ): Promise<{ id: string; createdAt: Date }>;
}

export interface ContactMessageSummary {
  id: string;
  subject: string;
  createdAt: Date;
}

export interface AdminContactStore {
  listMessages(businessId: string, limit: number, after?: string): Promise<{
    items: ContactMessageSummary[];
    nextCursor: string | null;
  } | null>;
  findMessage(businessId: string, id: string): Promise<(ContactMessageSummary & {
    name: string;
    email: string;
    phone: string | null;
    message: string;
  }) | null>;
}
