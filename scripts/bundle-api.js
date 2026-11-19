let esbuild;
try {
  esbuild = require('esbuild');
} catch {
  try {
    esbuild = require('../server/node_modules/esbuild');
  } catch {
    esbuild = require('../client/node_modules/esbuild');
  }
}
const path = require('path');

async function bundle() {
  console.log('Bundling server into api/index.js for Vercel Serverless Function...');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../server/src/serverless.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: path.resolve(__dirname, '../api/index.js'),
    external: [
      'bcryptjs',
      'cloudinary',
      'cookie-parser',
      'cors',
      'dotenv',
      'express',
      'express-rate-limit',
      'helmet',
      'jsonwebtoken',
      'mongodb-memory-server',
      'mongoose',
      'multer',
      'stripe',
      'supertest',
      'vitest',
      'zod'
    ],
    sourcemap: false,
    minify: false,
  });
  console.log('Successfully bundled api/index.js!');
}

bundle().catch((err) => {
  console.error('Bundle error:', err);
  process.exit(1);
});
