import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

await run(process.execPath, ['scripts/generate-openapi.mjs']);

try {
  await run('git', ['diff', '--exit-code', '--', 'src/generated/api/schema.ts']);
} catch (error) {
  console.error(
    '\nOpenAPI generated types are out of date. Run `yarn openapi:generate` and commit the updated schema.',
  );
  throw error;
}
