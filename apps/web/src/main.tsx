/**
 * main.tsx - Application Entry Point
 * 
 * Location: apps/web/src/ → Entry Points → main.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * This is the entry point for the React application. It:
 * - Creates a React root using the modern createRoot API
 * - Renders the main App component into the DOM
 * - Imports global CSS styles
 * 
 * The createRoot API is the recommended way to render React applications
 * in React 18+ and provides better performance and concurrent features.
 * 
 * The root element is expected to be a div with id="root" in the HTML.
 * 
 * Related Files:
 * - apps/web/index.html - HTML entry point
 * - apps/web/src/App.tsx - Root App component with routing
 * - apps/web/src/index.css - Global styles
 */

import { createRoot } from "react-dom/client";
import App from "./App";
import RTLPreviewPage from "./dev/rtl-preview";
import "./index.css";

const rootElement = document.getElementById("root")!;
const isRTLPreview = window.location.pathname.startsWith("/dev/rtl-preview");

createRoot(rootElement).render(isRTLPreview ? <RTLPreviewPage /> : <App />);
