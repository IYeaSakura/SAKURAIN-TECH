/**
 * EdgeOne Pages Edge Function for feed refresh API.
 * Route: /api/feed/refresh
 */

import { handleRefresh } from '../../lib/feed.js';

export default async function onRequest(context) {
  return handleRefresh(context.request, context.env);
}
