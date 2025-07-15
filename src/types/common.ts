export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}