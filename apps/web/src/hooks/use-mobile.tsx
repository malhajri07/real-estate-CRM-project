/**
 * use-mobile.tsx - Mobile Detection Hook
 * 
 * Location: apps/web/src/ → Hooks/ → use-mobile.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Custom React hook for detecting mobile viewport. Provides:
 * - Mobile breakpoint detection
 * - Responsive layout utilities
 * 
 * Related Files:
 * - Used throughout the application for responsive behavior
 */

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
