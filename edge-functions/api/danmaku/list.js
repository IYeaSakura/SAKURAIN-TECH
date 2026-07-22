/**
 * EdgeOne Pages Edge Function for danmaku list API.
 * Route: /api/danmaku/list
 */

import { handleList } from '../../lib/danmaku.js';

export default async function onRequest(context) {
  return handleList(context.request, context.env);
}
