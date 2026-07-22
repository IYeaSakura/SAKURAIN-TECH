/**
 * EdgeOne Pages Edge Function for feed get API.
 * Route: /api/feed/get
 */

import { handleGet } from '../../lib/feed.js';

export default async function onRequest(context) {
  return handleGet(context.request, context.env);
}
