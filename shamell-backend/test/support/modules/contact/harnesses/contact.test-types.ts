/** Narrow response shapes for contact e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type ContactCreatedBody = {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  isRead?: boolean;
};

export type ContactListBody = {
  items: ContactCreatedBody[];
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
};

export type PeticionesBody = {
  items: Array<{
    origin: string;
    id: string;
    createdAt?: string;
    created_at?: string;
  }>;
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
};

export type PeticionesBadgeBody = {
  count: number;
};
