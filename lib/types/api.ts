// API响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
  requestId?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
  requestId?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API请求参数类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// 设备ID验证类型
export interface DeviceIdValidation {
  isValid: boolean;
  deviceId: string;
  error?: string;
}