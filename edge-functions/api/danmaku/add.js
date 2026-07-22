/**
 * EdgeOne Pages Edge Function for danmaku add API.
 * Route: /api/danmaku/add
 */

import { handleAdd } from '../../lib/danmaku.js';

export default async function onRequest(context) {
  return handleAdd(context.request, context.env);
}
