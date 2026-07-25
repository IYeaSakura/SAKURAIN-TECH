import type { Metadata } from "next";
import NotFoundLoader from "@/components/notfound/NotFoundLoader";

/**
 * Global 404 page —— migrated from the legacy Vite project src/pages/NotFound.
 * Global navigation and effects are provided by the root layout ClientEffects;
 * this file only renders the 404 main content.
 */
export const metadata: Metadata = {
  title: "404 Page Not Found — SAKURAIN",
  description: "The page does not exist or has been moved.",
};

export default function NotFound() {
  return <NotFoundLoader />;
}
