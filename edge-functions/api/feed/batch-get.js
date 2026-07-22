/**
 * EdgeOne Pages Edge Function for feed batch-get API.
 * Route: /api/feed/batch-get
 */

import { handleBatchGet } from '../../lib/feed.js';

export default async function onRequest(context) {
  return handleBatchGet(context.request, context.env);
}
