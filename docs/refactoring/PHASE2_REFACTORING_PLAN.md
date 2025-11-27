# Phase 2: File Structure Refactoring - Detailed Plan

## Current Status

### ✅ Completed (Phase 1)
- Created logger utility
- Removed console.log statements from critical files
- Gated test routes

### 🔄 In Progress (Phase 2 - map.tsx)
- ✅ Created folder structure: `pages/map/{components,hooks,utils}`
- ✅ Extracted types to `pages/map/types.ts`
- ✅ Extracted constants to `pages/map/utils/constants.ts`
- ✅ Extracted formatters to `pages/map/utils/formatters.ts`
- ✅ Extracted map helpers to `pages/map/utils/map-helpers.ts`
- ✅ Extracted ErrorBoundary component
- ✅ Extracted SearchableCombobox component
- ⏳ Need to extract: FilterContent, PropertiesMap, PropertiesList
- ⏳ Need to create hooks for data fetching
- ⏳ Need to refactor main MapPage component

## map.tsx Refactoring Strategy

### File Structure:
```
pages/map/
├── index.tsx                    # Main page (orchestration, ~400 lines)
├── types.ts                     # ✅ All type definitions
├── components/
│   ├── ErrorBoundary.tsx        # ✅ Error boundary
│   ├── SearchableCombobox.tsx   # ✅ Combobox component
│   ├── FilterContent.tsx        # Filter sidebar (~240 lines)
│   ├── PropertiesMap.tsx       # Map view component (~240 lines)
│   └── PropertiesList.tsx      # Table view component (~210 lines)
├── hooks/
│   ├── useMapProperties.ts     # Property fetching logic
│   ├── useMapFilters.ts         # Filter state management
│   ├── useMapLocations.ts       # Location data fetching
│   └── useMapView.ts            # View state management
└── utils/
    ├── constants.ts             # ✅ Constants
    ├── formatters.ts            # ✅ Formatting functions
    └── map-helpers.ts           # ✅ Google Maps helpers
```

### Extraction Order:
1. ✅ Types and utilities (DONE)
2. ✅ Basic components (DONE)
3. ⏳ FilterContent component
4. ⏳ PropertiesMap component
5. ⏳ PropertiesList component
6. ⏳ Custom hooks
7. ⏳ Refactor main component

## Next Steps

Continue extracting components from map.tsx systematically.

