// Centralized environment variable access & defaults (JavaScript version).
// Using .js so NodeNext + ts-node/esm can resolve without pre-build.

/**
 * Return the value of an environment variable or a fallback.
 * Warn if both are missing.
 * @param {string} name
 * @param {string | undefined} [fallback]
 * @returns {string}
 */
function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    console.warn(`Environment variable ${name} not set. Using empty string; functionality may be limited.`);
    return '';
  }
  return value;
}

/** @type {string} */
export const SOURCE_BUCKET_NAME = required('SOURCE_BUCKET_NAME', 'your-source-json-bucket');
/** @type {string} */
export const DEST_BUCKET_NAME = required('DEST_BUCKET_NAME', 'your-final-static-site-bucket');

export const Env = { SOURCE_BUCKET_NAME, DEST_BUCKET_NAME };

export default Env;