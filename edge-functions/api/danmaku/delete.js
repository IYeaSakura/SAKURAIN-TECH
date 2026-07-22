/**
 * EdgeOne Pages Edge Function for danmaku delete API.
 * Route: /api/danmaku/delete
 */

import { handleDelete } from '../../lib/danmaku.js';

export default async function onRequest(context) {
  return handleDelete(context.request, context.env);
}
