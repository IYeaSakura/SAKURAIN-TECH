/**
 * EdgeOne Pages Edge Function for feed batch-refresh API.
 * Route: /api/feed/batch-refresh
 */

import { handleBatchRefresh } from '../../lib/feed.js';

export default async function onRequest(context) {
  return handleBatchRefresh(context.request, context.env);
}
