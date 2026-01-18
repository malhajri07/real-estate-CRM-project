/**
 * utils.ts - General Utilities
 * 
 * Location: apps/web/src/ → Lib/ → utils.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * General utility functions used throughout the application. Provides:
 * - Class name merging (cn function)
 * - Common helper functions
 * 
 * Related Files:
 * - Used throughout the application for className merging
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
