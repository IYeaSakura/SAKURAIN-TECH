import { RouteLoader } from "@/components/RouteLoader";

/**
 * Route-level loading feedback — the page is a client-only heavy bundle,
 * so render a placeholder immediately on navigation to avoid a blank screen
 * while the chunk downloads and executes.
 */
export default function Loading() {
  return <RouteLoader />;
}
