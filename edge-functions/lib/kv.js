/**
 * KV binding helpers for EdgeOne Pages Edge Functions.
 *
 * EdgeOne injects KV namespaces as global variables using the binding name
 * configured in the console. This module provides a small helper to resolve
 * a binding by name in both the EdgeOne runtime and local test environments.
 */

/**
 * Resolve a KV namespace binding by name.
 * @param {string} name
 * @param {Record<string, any>} [env]
 * @returns {any}
 */
export function getKV(name, env) {
  if (env && env[name]) {
    return env[name];
  }
  if (typeof globalThis !== 'undefined' && globalThis[name]) {
    return globalThis[name];
  }
  return undefined;
}
