import type { Metadata } from "next";
import AlgoVizLoader from "@/components/algoviz/AlgoVizLoader";

// Global CSS must be imported in the app/ directory (styles originally inside
// AlgoViz components were moved here for unified loading).
import "@/components/algoviz/algo-visualizer.css";
import "@/components/algoviz/components/memory-visualizer.css";

/**
 * /algo-viz —— Algorithm Visualization Lab.
 * Server Component shell; the actual content is the full-page client component
 * migrated from the legacy Vite project src/pages/AlgoViz/
 * (sorting/graph/DP, step-by-step execution engine + pseudocode sync).
 */
export const metadata: Metadata = {
  title: "Algorithm Visualization — SAKURAIN",
  description:
    "Learn classic algorithms interactively: sorting, graph theory, and dynamic programming visualizations with code and animation synced frame by frame, supporting single-step execution and replay.",
};

export default function Page() {
  return <AlgoVizLoader />;
}
