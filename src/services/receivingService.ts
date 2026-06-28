// Receiving Service - API calls for material receiving
import { apiFetchJson, buildPaginationParams } from '@/utils/api';
import type { Receiving, CreateReceivingPayload, ReceivingFilters } from '../types/receiving';
import type { ApiResponse, PaginatedResponse } from '../types/api';

export const receivingService = {
  /**
   * Get receivings with pagination and filters
   */
  getPaginated: async (
    page: number = 1,
    limit: number = 10,
    filters?: ReceivingFilters
  ): Promise<PaginatedResponse<Receiving>> => {
    const params = buildPaginationParams(page, limit, filters);
    return apiFetchJson<PaginatedResponse<Receiving>>(`/materials/transactions/receivings?${params}`);
  },

  /**
   * Get receiving by ID
   */
  getById: async (id: number): Promise<Receiving> => {
    const response = await apiFetchJson<ApiResponse<Receiving>>(`/materials/transactions/receivings/${id}`);
    return response.data!;
  },

  /**
   * Create new receiving
   */
  create: async (data: CreateReceivingPayload): Promise<Receiving> => {
    const response = await apiFetchJson<ApiResponse<Receiving>>('/materials/transactions/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data!;
  },

  /**
   * Get receiving by receiving number
   */
  getByReceivingNo: async (receivingNo: string): Promise<Receiving> => {
    const response = await apiFetchJson<ApiResponse<Receiving>>(`/materials/transactions/receivings/no/${receivingNo}`);
    return response.data!;
  },
};
