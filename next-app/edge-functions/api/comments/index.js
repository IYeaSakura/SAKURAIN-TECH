import { handleRequest } from '../../comments.js';

export default async function onRequest(context) {
  const { request, env } = context;
  return handleRequest(request, env);
}
