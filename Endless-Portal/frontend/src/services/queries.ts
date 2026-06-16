import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data;
    }
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newOrder: any) => {
      const { data } = await api.post('/orders', newOrder);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/orders/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/orders/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// --- INVENTORY QUERIES ---

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data } = await api.get('/inventory');
      return data;
    }
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newItem: any) => {
      const { data } = await api.post('/inventory', newItem);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/inventory/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

// --- EXTRAS QUERIES ---

export const useExtras = () => {
  return useQuery({
    queryKey: ['extras'],
    queryFn: async () => {
      const { data } = await api.get('/extras');
      return data;
    }
  });
};

export const useCreateExtra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newExtra: any) => {
      const { data } = await api.post('/extras', newExtra);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });
};

export const useUpdateExtra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/extras/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });
};

// --- FOLLOWUP QUERIES ---

export const useFollowups = () => {
  return useQuery({
    queryKey: ['followups'],
    queryFn: async () => {
      const { data } = await api.get('/followup');
      return data;
    }
  });
};

export const useCreateFollowup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newFollowup: any) => {
      const { data } = await api.post('/followup', newFollowup);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });
};

export const useUpdateFollowup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/followup/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followups'] });
    },
  });
};

// --- DELETE QUERIES ---

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/inventory/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};

export const useDeleteExtra = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/extras/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extras'] });
    },
  });
};

// --- DESIGN TYPES QUERIES ---

export const useDesignTypes = () => {
  return useQuery({
    queryKey: ['designTypes'],
    queryFn: async () => {
      const { data } = await api.get('/design-types');
      return data;
    }
  });
};

export const useCreateDesignType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newDesignType: any) => {
      const { data } = await api.post('/design-types', newDesignType);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designTypes'] });
    },
  });
};

export const useUpdateDesignType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/design-types/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designTypes'] });
    },
  });
};

export const useDeleteDesignType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/design-types/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designTypes'] });
    },
  });
};

// --- MATERIAL FAMILIES QUERIES ---

export const useMaterialFamilies = () => {
  return useQuery({
    queryKey: ['materialFamilies'],
    queryFn: async () => {
      const { data } = await api.get('/material-families');
      return data;
    },
  });
};

export const useCreateMaterialFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string }) => {
      const { data } = await api.post('/material-families', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialFamilies'] });
    },
  });
};

export const useUpdateMaterialFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string } }) => {
      const res = await api.put(`/material-families/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialFamilies'] });
    },
  });
};

export const useDeleteMaterialFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/material-families/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materialFamilies'] });
    },
  });
};

// --- USERS QUERIES ---

export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    }
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await api.put(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
