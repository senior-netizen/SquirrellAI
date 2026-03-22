const test = require('node:test');
const assert = require('node:assert/strict');
const { executeGeneration } = require('../pipeline/execute-generation');
const { generateNestJsCode } = require('../tools/generate_nestjs_code');
const { generateOpenApiSpec } = require('../tools/generate_openapi_spec');

const parsedIntent = {
  serviceName: 'Inventory Service',
  serviceDescription: 'Manages inventory items deterministically.',
  version: '1.0.0',
  schemas: [
    {
      name: 'CreateItem',
      fields: [
        { name: 'name', type: 'string', required: true },
        { name: 'quantity', type: 'integer', required: true },
      ],
    },
    {
      name: 'Item',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'quantity', type: 'integer', required: true },
      ],
    },
    {
      name: 'ItemNotFound',
      fields: [{ name: 'message', type: 'string', required: true }],
    },
    {
      name: 'ItemConflict',
      fields: [{ name: 'message', type: 'string', required: true }],
    },
  ],
  routes: [
    {
      operationId: 'createItem',
      method: 'post',
      path: '/items',
      tag: 'inventory',
      summary: 'Create an item',
      requestBodySchemaName: 'CreateItem',
      responseSchemas: [
        { statusCode: 201, description: 'Created', schemaName: 'Item' },
        { statusCode: 409, description: 'Conflict', schemaName: 'ItemConflict' },
      ],
    },
    {
      operationId: 'getItem',
      method: 'get',
      path: '/items/{id}',
      tag: 'inventory',
      summary: 'Get an item',
      pathParams: [{ name: 'id', type: 'string', required: true }],
      responseSchemas: [
        { statusCode: 200, description: 'Found', schemaName: 'Item' },
        { statusCode: 404, description: 'Not found', schemaName: 'ItemNotFound' },
      ],
    },
  ],
};

test('produces normalized OpenAPI JSON deterministically and validates references', () => {
  const artifactA = generateOpenApiSpec(parsedIntent);
  const artifactB = generateOpenApiSpec(parsedIntent);

  assert.equal(artifactA.json, artifactB.json);
  assert.equal(JSON.parse(artifactA.json).openapi, '3.0.3');
  assert.equal(artifactA.checksum, artifactB.checksum);
});

test('emits a NestJS file manifest with source, DTO, artifact, and Jest test files', () => {
  const { document } = generateOpenApiSpec(parsedIntent);
  const { manifest, consistencyReport } = generateNestJsCode(document);
  const relativePaths = manifest.files.map((file) => file.relativePath);

  assert.equal(manifest.formatVersion, '1.0');
  assert.ok(relativePaths.includes('src/app.module.ts'));
  assert.ok(relativePaths.includes('src/generated/openapi.generated.json'));
  assert.ok(relativePaths.includes('src/generated/route-consistency.generated.json'));
  assert.ok(relativePaths.includes('src/inventory/inventory.module.ts'));
  assert.ok(relativePaths.includes('src/inventory/inventory.controller.ts'));
  assert.ok(relativePaths.includes('src/inventory/inventory.service.ts'));
  assert.ok(relativePaths.includes('src/inventory/dto/CreateItem.dto.ts'));
  assert.ok(relativePaths.includes('src/inventory/dto/Item.dto.ts'));
  assert.ok(relativePaths.includes('src/inventory/dto/ItemConflict.dto.ts'));
  assert.ok(relativePaths.includes('src/inventory/dto/ItemNotFound.dto.ts'));
  assert.ok(relativePaths.includes('src/inventory/__tests__/inventory.controller.spec.ts'));
  assert.ok(manifest.files.every((file) => file.checksum.length === 64));
  assert.equal(consistencyReport.ok, true);
});

test('stores normalized spec JSON and file manifest on the execution record for audit and replay', () => {
  const executionRecord = executeGeneration(parsedIntent);

  assert.match(executionRecord.normalizedSpecJson, /Inventory Service/);
  assert.ok(executionRecord.fileManifest.files.length > 5);
  assert.equal(executionRecord.consistencyReport.ok, true);
  assert.equal(executionRecord.executionId.length, 64);
});

test('rejects invalid intents that reference missing schemas', () => {
  assert.throws(
    () =>
      generateOpenApiSpec({
        ...parsedIntent,
        routes: [
          {
            ...parsedIntent.routes[0],
            requestBodySchemaName: 'MissingSchema',
          },
        ],
      }),
    /Request schema missing/,
  );
});
