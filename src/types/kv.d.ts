/**
 * Minimal KVNamespace type declaration for EdgeOne KV bindings.
 * EdgeOne injects KV namespaces as global variables in the edge runtime.
 */

interface KVNamespaceGetOptions<Type> {
  type?: Type;
  cacheTtl?: number;
}

interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: unknown;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, options: KVNamespaceGetOptions<'text'>): Promise<string | null>;
  get(key: string, options: KVNamespaceGetOptions<'json'>): Promise<unknown | null>;
  get(key: string, options: KVNamespaceGetOptions<'arrayBuffer'>): Promise<ArrayBuffer | null>;
  get(key: string, options: KVNamespaceGetOptions<'stream'>): Promise<ReadableStream | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}
