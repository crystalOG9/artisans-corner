import { describe, expect, it } from 'vitest';
import { isImageBufferValid } from '../src/services/uploadService';
import { listProductsQuerySchema } from '../src/validators/productValidator';

describe('Security Hardening Suite', () => {
  describe('File Upload Magic Byte Verification', () => {
    it('accepts valid JPEG buffer headers (FF D8 FF)', () => {
      const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      expect(isImageBufferValid(validJpeg)).toBe(true);
    });

    it('accepts valid PNG buffer headers (89 50 4E 47)', () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      expect(isImageBufferValid(validPng)).toBe(true);
    });

    it('accepts valid WebP buffer headers (RIFF....WEBP)', () => {
      const validWebp = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0x24, 0x00, 0x00, 0x00]),
        Buffer.from('WEBP', 'ascii'),
      ]);
      expect(isImageBufferValid(validWebp)).toBe(true);
    });

    it('rejects polyglot or disguised executable files with fake image extensions', () => {
      const maliciousPayload = Buffer.from('<?php echo "evil"; ?> some dummy trailing content here');
      expect(isImageBufferValid(maliciousPayload)).toBe(false);
    });

    it('rejects short corrupted buffers (<12 bytes)', () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8]);
      expect(isImageBufferValid(tinyBuffer)).toBe(false);
    });
  });

  describe('Query Validation & ReDoS Protection', () => {
    it('validates and accepts legitimate product search queries', () => {
      const parsed = listProductsQuerySchema.safeParse({
        query: {
          page: '1',
          limit: '10',
          search: 'stoneware mug',
          category: 'Ceramics & Pottery',
          sort: 'price_asc',
        },
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.query.page).toBe(1);
        expect(parsed.data.query.limit).toBe(10);
      }
    });

    it('rejects excessive search strings to prevent ReDoS', () => {
      const tooLongSearch = 'a'.repeat(150);
      const parsed = listProductsQuerySchema.safeParse({
        query: {
          search: tooLongSearch,
        },
      });
      expect(parsed.success).toBe(false);
    });

    it('rejects malformed storeId parameter format', () => {
      const parsed = listProductsQuerySchema.safeParse({
        query: {
          storeId: 'invalid-non-mongo-id',
        },
      });
      expect(parsed.success).toBe(false);
    });
  });
});
