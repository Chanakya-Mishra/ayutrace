"use client";

import useSWR, { mutate } from "swr";

export interface InventoryFilters {
  search?: string;
  facilityId?: string;
  status?: string;
  category?: string;
  dosageForm?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Custom SWR Hook for Dashboard KPI and Analytics Stats
 */
export function useStats(facilityId: string = "all") {
  const url = facilityId && facilityId !== "all" 
    ? `/api/stats?facilityId=${encodeURIComponent(facilityId)}` 
    : "/api/stats";

  const { data, error, isLoading, isValidating, mutate: mutateThis } = useSWR(url);

  return {
    stats: data,
    isLoading,
    isValidating,
    error,
    mutate: mutateThis,
  };
}

/**
 * Custom SWR Hook for Facilities & Storage Locations
 */
export function useFacilities() {
  const { data, error, isLoading, isValidating, mutate: mutateThis } = useSWR("/api/facilities");

  return {
    facilities: (data as any[]) || [],
    isLoading,
    isValidating,
    error,
    mutate: mutateThis,
  };
}

/**
 * Custom SWR Hook for Medicine Batches & Inventory
 */
export function useInventory(filters?: InventoryFilters) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.facilityId && filters.facilityId !== "all") params.set("facilityId", filters.facilityId);
  if (filters?.status && filters.status !== "all") params.set("status", filters.status);
  if (filters?.category && filters.category !== "all") params.set("category", filters.category);
  if (filters?.dosageForm && filters.dosageForm !== "all") params.set("dosageForm", filters.dosageForm);
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.set("sortOrder", filters.sortOrder);

  const queryString = params.toString();
  const url = queryString ? `/api/inventory?${queryString}` : "/api/inventory";

  const { data, error, isLoading, isValidating, mutate: mutateThis } = useSWR(url);

  return {
    batches: (data as any[]) || [],
    isLoading,
    isValidating,
    error,
    mutate: mutateThis,
  };
}

/**
 * Custom SWR Hook for Stock Transfers
 */
export function useTransfers() {
  const { data, error, isLoading, isValidating, mutate: mutateThis } = useSWR("/api/transfers");

  return {
    transfers: (data as any[]) || [],
    isLoading,
    isValidating,
    error,
    mutate: mutateThis,
  };
}

/**
 * Custom SWR Hook for Application & Organization Settings
 */
export function useSettings() {
  const { data, error, isLoading, isValidating, mutate: mutateThis } = useSWR("/api/settings");

  return {
    settings: data || null,
    isLoading,
    isValidating,
    error,
    mutate: mutateThis,
  };
}

/**
 * Global cache invalidation helpers across all mounted components
 */
export const revalidateAll = () => {
  mutate((key) => typeof key === "string" && key.startsWith("/api/"));
};

export const revalidateStats = () => {
  mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
};

export const revalidateInventory = () => {
  mutate((key) => typeof key === "string" && key.startsWith("/api/inventory"));
};

export const revalidateFacilities = () => {
  mutate((key) => typeof key === "string" && key.startsWith("/api/facilities"));
};

export const revalidateTransfers = () => {
  mutate((key) => typeof key === "string" && key.startsWith("/api/transfers"));
};
