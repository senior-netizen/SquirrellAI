import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolCommandPolicy, ValidationError } from '../src/application/tools/tool-command-policy';

const policy = new ToolCommandPolicy();

test('ToolCommandPolicy returns allowlisted commands for install/test/start actions', () => {
  assert.deepEqual(policy.resolve('installDependencies'), {
    commandId: 'install-dependencies',
    argv: ['npm', 'ci', '--ignore-scripts=false'],
  });
  assert.deepEqual(policy.resolve('runTests'), {
    commandId: 'run-tests',
    argv: ['npm', 'test', '--', '--runInBand'],
  });
  assert.deepEqual(policy.resolve('startService'), {
    commandId: 'start-service',
    argv: ['npm', 'run', 'start'],
  });
});

test('ToolCommandPolicy rejects path traversal for sandbox file access', () => {
  assert.throws(() => policy.resolve('readLog', { relativePath: '../etc/passwd' }), ValidationError);
});

test('ToolCommandPolicy encodes file writes for execution inside the sandbox', () => {
  const command = policy.resolve('writeFile', {
    relativePath: 'src/main.ts',
    contents: 'console.log("safe");',
    mode: 0o600,
  });

  assert.equal(command.commandId, 'write-file');
  assert.deepEqual(command.argv, ['node', '/opt/runner/bin/write-file.mjs']);
  assert.equal(command.env?.TARGET_FILE_RELATIVE_PATH, 'src/main.ts');
  assert.equal(command.env?.TARGET_FILE_MODE, '600');
  assert.equal(
    Buffer.from(command.env?.TARGET_FILE_CONTENTS_BASE64 ?? '', 'base64').toString('utf8'),
    'console.log("safe");',
  );
});
