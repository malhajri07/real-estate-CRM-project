/**
 * Type definitions for Unverified Listing Page
 */

export interface ListingFormData {
  title: string;
  description: string;
  propertyCategory: string;
  propertyType: string;
  listingType: string;
  region: string;
  city: string;
  district: string;
  streetAddress: string;
  latitude: string;
  longitude: string;
  bedrooms: string;
  bathrooms: string;
  livingRooms: string;
  kitchens: string;
  floorNumber: string;
  totalFloors: string;
  areaSqm: string;
  buildingYear: string;
  hasParking: boolean;
  hasElevator: boolean;
  hasMaidsRoom: boolean;
  hasDriverRoom: boolean;
  furnished: boolean;
  balcony: boolean;
  swimmingPool: boolean;
  centralAc: boolean;
  price: string;
  currency: string;
  paymentFrequency: string;
  contactName: string;
  mobileNumber: string;
  videoClipUrl: string;
}

export interface Step {
  id: number;
  title: string;
  description: string;
}

export interface ListingType {
  value: string;
  label: string;
}

