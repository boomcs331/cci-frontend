// Receiving Service - API calls for material receiving
import { apiFetchJson } from '@/utils/api';
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
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

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
