import crypto from 'crypto';

export function toSlug(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base || 'item'}-${suffix}`;
}

