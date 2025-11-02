/**
 * Unified Page Structure Configuration
 * 
 * Defines consistent HTML structure for all platform pages:
 * - Standard main container
 * - Consistent section organization
 * - Unified card patterns
 * - RTL support
 * 
 * Structure pattern:
 * <main className={PAGE_WRAPPER} dir="rtl">
 *   <section> (optional, for grouping related content)
 *     <Card> or <div> (content containers)
 *   </section>
 * </main>
 */

import { PAGE_WRAPPER, CARD_STYLES, TYPOGRAPHY } from "./platform-theme";

// Standard page structure
export const PAGE_STRUCTURE = {
  // Main container - always use this for page wrapper
  main: PAGE_WRAPPER,
  
  // Section wrapper - use for grouping major content areas
  section: "space-y-6",
  
  // Card container - standard card wrapper
  card: CARD_STYLES.container,
  
  // Card header - consistent header styling
  cardHeader: CARD_STYLES.header,
  
  // Card content - consistent content padding
  cardContent: "space-y-4",
} as const;

// Page layout patterns
export const PAGE_LAYOUTS = {
  // Single column layout
  singleColumn: "max-w-4xl mx-auto",
  
  // Two column layout
  twoColumn: "grid grid-cols-1 lg:grid-cols-2 gap-6",
  
  // Three column layout
  threeColumn: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  
  // Four column layout
  fourColumn: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6",
} as const;

// Standard page section patterns
export const SECTION_PATTERNS = {
  // Header section with title and actions
  header: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6",
  
  // Content section
  content: "space-y-6",
  
  // Grid section
  grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  
  // List section
  list: "space-y-4",
} as const;

