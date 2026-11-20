export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewInput {
  customerName: string;
  rating: number;
  message: string;
  email?: string;
}

export interface PublicReview {
  id: string;
  customerName: string;
  rating: number;
  message: string;
  createdAt: Date;
}

export interface AdminReview extends PublicReview {
  email: string | null;
  status: ReviewStatus;
  updatedAt: Date;
}

export interface AdminReviewListOptions {
  status?: ReviewStatus | undefined;
  page: number;
  limit: number;
}

export interface AdminReviewList {
  items: AdminReview[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewStore {
  findPublicBusinessId(): Promise<string | null>;
  create(businessId: string, input: ReviewInput): Promise<{ id: string; status: ReviewStatus }>;
  listApproved(businessId: string): Promise<PublicReview[]>;
  listForAdmin(
    businessId: string,
    options: AdminReviewListOptions,
  ): Promise<AdminReviewList>;
  updateStatus(businessId: string, reviewId: string, status: ReviewStatus): Promise<{ id: string; status: ReviewStatus } | null>;
}
