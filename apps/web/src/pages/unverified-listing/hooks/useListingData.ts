/**
 * useListingData Hook
 * 
 * Handles fetching location and property data for listing form
 */

import { useQuery } from "@tanstack/react-query";
import type { ListingFormData } from "../types";

export function useListingData(form: ListingFormData) {
  // Fetch regions
  const { data: regions } = useQuery<any[]>({
    queryKey: ["/api/regions"],
    queryFn: async () => {
      const response = await fetch("/api/locations/regions");
      if (!response.ok) throw new Error("Failed to fetch regions");
      return response.json();
    },
  });

  // Fetch cities
  const { data: cities } = useQuery<any[]>({
    queryKey: ["/api/saudi-cities"],
    queryFn: async () => {
      const response = await fetch("/api/saudi-cities");
      if (!response.ok) throw new Error("Failed to fetch cities");
      return response.json();
    },
  });

  // Fetch districts based on selected city
  const { data: districts, isLoading: districtsLoading, error: districtsError } = useQuery<any[]>({
    queryKey: ["/api/districts", form.city],
    queryFn: async () => {
      if (!form.city) return [];
      const response = await fetch(`/api/locations/districts?cityId=${form.city}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch districts:", response.status, errorText);
        throw new Error(`Failed to fetch districts: ${response.status}`);
      }
      const data = await response.json();
      console.log("Districts loaded for city", form.city, ":", data);
      return data;
    },
    enabled: !!form.city,
    retry: 2,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch property categories
  const { data: propertyCategories, isLoading: categoriesLoading, error: categoriesError } = useQuery<any[]>({
    queryKey: ["/api/property-categories"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/property-categories");
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch property categories:", response.status, errorText);
          throw new Error(`Failed to fetch property categories: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching property categories:", error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch property types filtered by selected category
  const { data: propertyTypes, isLoading: typesLoading, error: typesError } = useQuery<any[]>({
    queryKey: ["/api/property-types", form.propertyCategory],
    queryFn: async () => {
      if (!form.propertyCategory) return [];
      try {
        const response = await fetch(`/api/property-types?categoryCode=${form.propertyCategory}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch property types:", response.status, errorText);
          throw new Error(`Failed to fetch property types: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching property types:", error);
        throw error;
      }
    },
    enabled: !!form.propertyCategory,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Filter cities and districts based on selected region
  const filteredCities = form.region
    ? cities?.filter((city) => city.regionId === Number(form.region)) || []
    : cities || [];

  // Districts are already filtered by cityId from the API query, so we use them directly
  const filteredDistricts = districts || [];

  return {
    regions,
    cities,
    districts,
    districtsLoading,
    districtsError,
    propertyCategories,
    categoriesLoading,
    categoriesError,
    propertyTypes,
    typesLoading,
    typesError,
    filteredCities,
    filteredDistricts,
  };
}

