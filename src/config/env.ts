// Centralized environment variable access & defaults.
// NodeNext: keep .js import targets when importing from this module in TS.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    console.warn(`Environment variable ${name} not set. Using empty string; functionality may be limited.`);
    return '';
  }
  return value;
}

export const SOURCE_BUCKET_NAME = required('SOURCE_BUCKET_NAME', 'your-source-json-bucket');
export const DEST_BUCKET_NAME = required('DEST_BUCKET_NAME', 'your-final-static-site-bucket');

// Helper object if you prefer grouped access.
export const Env = {
  SOURCE_BUCKET_NAME,
  DEST_BUCKET_NAME,
};
