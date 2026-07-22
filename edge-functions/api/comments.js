/**
 * EdgeOne Pages Edge Function for comments API.
 * Route: /api/comments
 */

import { handleComments } from '../lib/comments.js';

export default async function onRequest(context) {
  return handleComments(context.request, context.env);
}
