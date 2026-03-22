import { readFile } from 'node:fs/promises';
import path from 'node:path';

const relativePath = process.env.LOG_FILE_RELATIVE_PATH;
if (!relativePath) {
  throw new Error('LOG_FILE_RELATIVE_PATH is required');
}

const filePath = path.resolve('/workspace/project', relativePath);
if (!filePath.startsWith('/workspace/project/')) {
  throw new Error('Log path escapes workspace root');
}

const contents = await readFile(filePath, 'utf8');
process.stdout.write(contents);
