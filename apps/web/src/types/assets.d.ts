/**
 * assets.d.ts - Asset Type Definitions
 * 
 * Location: apps/web/src/ → Types/ → assets.d.ts
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * TypeScript type definitions for asset imports. Defines:
 * - Image file module types (PNG, JPG, SVG, etc.)
 * - Asset import types
 * 
 * Related Files:
 * - Used throughout the application for asset imports
 */

declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.jpg" {
    const value: string;
    export default value;
}

declare module "*.jpeg" {
    const value: string;
    export default value;
}

declare module "*.svg" {
    import React = require("react");
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}
