import apiClient from "../utils/axios";
import { API_ENDPOINTS } from "../utils/constants";

export interface Project {
  MaProject: number;
  TenProject: string;
  MoTa?: string;
  TrangThai: string;
  NgayTao: string;
  NgayCapNhat: string;
  MaNVCreate?: number;
  TenNVCreate?: string;
}

export interface ProjectCreateRequest {
  TenProject: string;
  MoTa?: string;
  TrangThai?: string;
}

export interface ProjectUpdateRequest {
  TenProject?: string;
  MoTa?: string;
  TrangThai?: string;
}

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    return apiClient(API_ENDPOINTS.PROJECT.GET_ALL);
  },

  getOne: async (id: number): Promise<Project> => {
    return apiClient(API_ENDPOINTS.PROJECT.GET_ONE(id));
  },

  create: async (data: ProjectCreateRequest): Promise<Project> => {
    return apiClient(API_ENDPOINTS.PROJECT.CREATE, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: ProjectUpdateRequest): Promise<Project> => {
    return apiClient(API_ENDPOINTS.PROJECT.UPDATE(id), {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string; MaProject: number }> => {
    return apiClient(API_ENDPOINTS.PROJECT.DELETE(id), {
      method: "DELETE",
    });
  },
};

