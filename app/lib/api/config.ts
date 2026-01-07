import apiClient from "../utils/axios";

export interface SystemConfig {
  [key: string]: string;
}

export interface ConfigUpdateRequest {
  value: string;
}

export const configApi = {
  getAll: async (): Promise<SystemConfig> => {
    return apiClient("/config/");
  },

  update: async (key: string, value: string): Promise<{ [key: string]: string }> => {
    return apiClient(`/config/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    });
  },
};

