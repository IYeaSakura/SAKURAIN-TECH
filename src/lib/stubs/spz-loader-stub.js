/**
 * Stub for @spz-loader/core.
 *
 * The real package ships Emscripten-generated code that contains octal escape
 * sequences inside template strings, which causes a client-side SyntaxError in
 * strict mode. SAKURAIN-TECH does not load SPZ assets on the earth-online page,
 * so this stub prevents the broken dependency from being bundled while keeping
 * the import graph valid.
 */

/**
 * Placeholder for the SPZ decode entry point.
 */
export function loadSpz() {
  throw new Error('SPZ loading is disabled in this build.');
}
