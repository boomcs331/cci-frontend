// Material Service - API calls for materials
import { apiFetchJson, getApiUrl } from '@/utils/api';
import type { Material, MaterialType, MaterialFilters } from '../types/material';
import type { Location } from '../types/material';
import type { Supplier } from '../types/material';
import type { ApiResponse, PaginatedResponse } from '../types/api';

export const materialService = {
  /**
   * Get all materials
   */
  getAll: async (): Promise<Material[]> => {
    const response = await apiFetchJson<ApiResponse<Material[]>>('/materials/all');
    return response.data || [];
  },

  /**
   * Get materials with pagination and filters
   */
  getPaginated: async (
    page: number = 1, 
    limit: number = 10, 
    filters?: MaterialFilters
  ): Promise<PaginatedResponse<Material>> => {
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

    return apiFetchJson<PaginatedResponse<Material>>(`/materials?${params}`);
  },

  /**
   * Get material by ID
   */
  getById: async (id: number): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>(`/materials/${id}`);
    return response.data!;
  },

  /**
   * Create new material
   */
  create: async (data: Partial<Material>): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>('/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data!;
  },

  /**
   * Update material
   */
  update: async (id: number, data: Partial<Material>): Promise<Material> => {
    const response = await apiFetchJson<ApiResponse<Material>>(`/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.data!;
  },

  /**
   * Delete material
   */
  delete: async (id: number): Promise<void> => {
    await apiFetchJson(`/materials/${id}`, {
      method: 'DELETE'
    });
  },

  /**
   * Get all material types
   */
  getTypes: async (): Promise<MaterialType[]> => {
    const response = await apiFetchJson<ApiResponse<MaterialType[]>>('/materials/types/all');
    return response.data || [];
  },

  /**
   * Get all locations
   */
  getLocations: async (): Promise<Location[]> => {
    const response = await apiFetchJson<ApiResponse<Location[]>>('/materials/locations/all');
    return response.data || [];
  },

  /**
   * Get all suppliers
   */
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await apiFetchJson<ApiResponse<Supplier[]>>('/materials/suppliers/all');
    return response.data || [];
  },
};
