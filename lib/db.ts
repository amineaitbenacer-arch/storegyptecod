import { neon } from '@neondatabase/serverless';

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
