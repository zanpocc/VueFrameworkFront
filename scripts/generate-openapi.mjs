import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = process.env.OPENAPI_SCHEMA || 'http://127.0.0.1:8080/v3/api-docs/platform';
const output = process.env.OPENAPI_OUTPUT || 'src/generated/api/schema.ts';
const outputPath = path.resolve(root, output);
const executable = process.platform === 'win32' ? 'openapi-typescript.cmd' : 'openapi-typescript';
const bin = path.resolve(root, 'node_modules/.bin', executable);

await mkdir(path.dirname(outputPath), { recursive: true });

await new Promise((resolve, reject) => {
  const child = spawn(bin, [schema, '--output', outputPath], {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('error', reject);
  child.on('exit', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`openapi-typescript exited with code ${code}`));
  });
});
