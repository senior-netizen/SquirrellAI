import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const relativePath = process.env.TARGET_FILE_RELATIVE_PATH;
const encodedContents = process.env.TARGET_FILE_CONTENTS_BASE64;
const modeRaw = process.env.TARGET_FILE_MODE;

if (!relativePath || !encodedContents) {
  throw new Error('TARGET_FILE_RELATIVE_PATH and TARGET_FILE_CONTENTS_BASE64 are required');
}

const targetPath = path.resolve('/workspace/project', relativePath);
if (!targetPath.startsWith('/workspace/project/')) {
  throw new Error('Target path escapes workspace root');
}

await mkdir(path.dirname(targetPath), { recursive: true });
await writeFile(targetPath, Buffer.from(encodedContents, 'base64'), {
  mode: modeRaw ? Number.parseInt(modeRaw, 8) : 0o644,
});
