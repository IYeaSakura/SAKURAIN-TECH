import { RouteLoader } from "@/components/RouteLoader";

/**
 * Route-level loading feedback — the page is statically generated and only
 * shown as a fallback inside the client-side navigation Suspense boundary.
 */
export default function Loading() {
  return <RouteLoader />;
}
