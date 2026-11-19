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
    footer: {
      js: `
if (typeof module !== "undefined" && module.exports) {
  const def = module.exports.default || module.exports;
  module.exports = def;
  module.exports.default = def;
}
`
    }
  });
  console.log('Successfully bundled api/index.js!');

  // Mirror to client/api/index.js so deployments configured with Root Directory = client also find the serverless API
  const fs = require('fs');
  const clientApiDir = path.resolve(__dirname, '../client/api');
  fs.mkdirSync(clientApiDir, { recursive: true });
  fs.copyFileSync(
    path.resolve(__dirname, '../api/index.js'),
    path.resolve(clientApiDir, 'index.js')
  );
  console.log('Mirrored serverless API to client/api/index.js');
}

bundle().catch((err) => {
  console.error('Bundle error:', err);
  process.exit(1);
});
