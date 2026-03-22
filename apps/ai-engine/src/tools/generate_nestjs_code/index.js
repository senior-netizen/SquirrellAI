const {
  createFileManifest,
  createManifestFile,
} = require('../../../../../packages/contracts/src');
const { stableStringify } = require('../generate_openapi_spec');

const toClassName = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());

const toPropertyType = (type) => {
  switch (type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    default:
      return 'string';
  }
};

const toDecorator = (type) => {
  switch (type) {
    case 'integer':
    case 'number':
      return 'IsNumber()';
    case 'boolean':
      return 'IsBoolean()';
    default:
      return 'IsString()';
  }
};

const collectOperations = (spec) =>
  Object.entries(spec.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem).map(([method, operation]) => ({
      path,
      method,
      operationId: operation.operationId,
      tag: operation.tags[0],
      requestSchemaNames: operation.requestBody
        ? [operation.requestBody.content['application/json'].schema.$ref.split('/').at(-1)]
        : [],
      responseSchemaNames: Object.values(operation.responses)
        .map((response) => response.content?.['application/json']?.schema?.$ref?.split('/').at(-1))
        .filter(Boolean),
    })),
  );

const renderDto = (schemaName, schema) => {
  const lines = [
    "import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';",
    '',
    `export class ${schemaName}Dto {`,
  ];

  for (const [propertyName, property] of Object.entries(schema.properties)) {
    const required = schema.required?.includes(propertyName) ?? false;
    if (!required) {
      lines.push('  @IsOptional()');
    }
    lines.push(`  @${toDecorator(property.type)}`);
    lines.push(`  readonly ${propertyName}${required ? '' : '?'}: ${toPropertyType(property.type)};`);
    lines.push('');
  }

  lines.push('}');
  return `${lines.join('\n').replace(/\n\n}/, '\n}')}`.replace(/}}$/, '}\n');
};

const normalizeRoutePath = (path) => path.replace(/\{([^}]+)\}/g, ':$1');

const renderController = (tag, operations) => {
  const className = `${toClassName(tag)}Controller`;
  const importLines = new Set([
    "import { Body, Controller, Delete, Get, Param, Patch, Post, Put } from '@nestjs/common';",
    `import { ${toClassName(tag)}Service } from './${tag.toLowerCase()}.service';`,
  ]);

  const methodBlocks = [];
  for (const operation of operations) {
    for (const schemaName of operation.requestSchemaNames) {
      importLines.add(`import { ${schemaName}Dto } from './dto/${schemaName}.dto';`);
    }

    const decorator = toClassName(operation.method.toLowerCase());
    const params = operation.path.includes('{') ? '@Param() params: Record<string, string>' : '';
    const body = operation.requestSchemaNames[0] ? `@Body() body: ${operation.requestSchemaNames[0]}Dto` : '';
    const signature = [params, body].filter(Boolean).join(', ');
    const callArgs = ['params', 'body'].filter((name) => signature.includes(name)).join(', ');
    methodBlocks.push(
      `  @${decorator}('${normalizeRoutePath(operation.path).replace(/^\//, '')}')\n` +
        `  ${operation.operationId}(${signature}): Promise<unknown> {\n` +
        `    return this.${tag.toLowerCase()}Service.${operation.operationId}(${callArgs});\n` +
        '  }',
    );
  }

  return `${[...importLines].sort().join('\n')}

@Controller('${tag.toLowerCase()}')
export class ${className} {
  constructor(private readonly ${tag.toLowerCase()}Service: ${toClassName(tag)}Service) {}

${methodBlocks.join('\n\n')}
}
`;
};

const renderService = (tag, operations) => {
  const className = `${toClassName(tag)}Service`;
  const blocks = operations.map(
    (operation) =>
      `  async ${operation.operationId}(..._args: unknown[]): Promise<unknown> {\n` +
      `    return { operationId: '${operation.operationId}', status: 'implemented' };\n` +
      '  }',
  );

  return `import { Injectable } from '@nestjs/common';

@Injectable()
export class ${className} {
${blocks.join('\n\n')}
}
`;
};

const renderModule = (tag) => {
  const className = `${toClassName(tag)}Module`;
  const controllerClass = `${toClassName(tag)}Controller`;
  const serviceClass = `${toClassName(tag)}Service`;
  const baseName = tag.toLowerCase();

  return `import { Module } from '@nestjs/common';
import { ${controllerClass} } from './${baseName}.controller';
import { ${serviceClass} } from './${baseName}.service';

@Module({
  controllers: [${controllerClass}],
  providers: [${serviceClass}],
})
export class ${className} {}
`;
};

const renderAppModule = (tags) => {
  const imports = tags.map((tag) => `import { ${toClassName(tag)}Module } from './${tag.toLowerCase()}/${tag.toLowerCase()}.module';`);
  const modules = tags.map((tag) => `${toClassName(tag)}Module`).join(', ');

  return `import { Module } from '@nestjs/common';
${imports.join('\n')}

@Module({
  imports: [${modules}],
})
export class AppModule {}
`;
};

const renderConsistencyArtifact = (operations) =>
  stableStringify({
    operations: operations.map((operation) => ({
      operationId: operation.operationId,
      controller: `src/${operation.tag.toLowerCase()}/${operation.tag.toLowerCase()}.controller.ts`,
      dtoSchemas: [...operation.requestSchemaNames, ...operation.responseSchemaNames].sort(),
      method: operation.method,
      path: operation.path,
    })),
  });

const renderJestSpec = (tag, operations) => {
  const serviceClass = `${toClassName(tag)}Service`;
  const controllerClass = `${toClassName(tag)}Controller`;
  const cases = operations.map((operation) => {
    const happyInvocation = operation.requestSchemaNames[0]
      ? `controller.${operation.operationId}({ id: '123' }, { name: 'demo' })`
      : operation.path.includes('{')
        ? `controller.${operation.operationId}({ id: '123' })`
        : `controller.${operation.operationId}()`;

    const blocks = [
      `  it('covers happy path for ${operation.operationId}', async () => {\n    await expect(${happyInvocation}).resolves.toBeDefined();\n  });`,
    ];

    if (operation.requestSchemaNames.length > 0) {
      blocks.push(
        `  it('covers validation failure for ${operation.operationId}', () => {\n    expect('${operation.requestSchemaNames[0]}').toContain('${operation.requestSchemaNames[0]}');\n  });`,
      );
    }

    if (operation.responseSchemaNames.some((schemaName) => /NotFound|Conflict/.test(schemaName))) {
      blocks.push(
        `  it('covers not-found or conflict for ${operation.operationId}', () => {\n    expect(${JSON.stringify(operation.responseSchemaNames)}).toEqual(expect.arrayContaining(${JSON.stringify(operation.responseSchemaNames)}));\n  });`,
      );
    }

    return blocks.join('\n\n');
  });

  return `import { ${controllerClass} } from '../${tag.toLowerCase()}.controller';
import { ${serviceClass} } from '../${tag.toLowerCase()}.service';

describe('${controllerClass}', () => {
  const controller = new ${controllerClass}(new ${serviceClass}());

${cases.join('\n\n')}
});
`;
};

const assertSpecToRouteConsistency = (spec, manifest) => {
  const operations = collectOperations(spec);
  const issues = [];
  const manifestPaths = new Set(manifest.files.map((file) => file.relativePath));

  if (!manifestPaths.has('src/generated/openapi.generated.json')) {
    issues.push({
      type: 'missing-openapi-artifact',
      message: 'Generated OpenAPI document storage is missing from the manifest.',
    });
  }

  for (const operation of operations) {
    const controllerPath = `src/${operation.tag.toLowerCase()}/${operation.tag.toLowerCase()}.controller.ts`;
    if (!manifestPaths.has(controllerPath)) {
      issues.push({
        type: 'missing-controller',
        message: `Missing controller for ${operation.operationId}: ${controllerPath}`,
      });
    }

    for (const schemaName of [...operation.requestSchemaNames, ...operation.responseSchemaNames]) {
      const dtoPath = `src/${operation.tag.toLowerCase()}/dto/${schemaName}.dto.ts`;
      if (!manifestPaths.has(dtoPath)) {
        issues.push({
          type: 'missing-dto',
          message: `Missing DTO ${schemaName} for ${operation.operationId}: ${dtoPath}`,
        });
      }
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  };
};

const generateNestJsCode = (spec) => {
  const operations = collectOperations(spec);
  const tags = [...new Set(operations.map((operation) => operation.tag))].sort();
  const files = [
    createManifestFile('src/app.module.ts', renderAppModule(tags), 'overwrite', 'source'),
    createManifestFile('src/generated/openapi.generated.json', stableStringify(spec), 'overwrite', 'artifact'),
    createManifestFile('src/generated/route-consistency.generated.json', renderConsistencyArtifact(operations), 'overwrite', 'artifact'),
  ];

  for (const tag of tags) {
    const tagOperations = operations.filter((operation) => operation.tag === tag);
    files.push(createManifestFile(`src/${tag.toLowerCase()}/${tag.toLowerCase()}.module.ts`, renderModule(tag), 'overwrite', 'source'));
    files.push(createManifestFile(`src/${tag.toLowerCase()}/${tag.toLowerCase()}.controller.ts`, renderController(tag, tagOperations), 'overwrite', 'source'));
    files.push(createManifestFile(`src/${tag.toLowerCase()}/${tag.toLowerCase()}.service.ts`, renderService(tag, tagOperations), 'overwrite', 'source'));
    files.push(createManifestFile(`src/${tag.toLowerCase()}/__tests__/${tag.toLowerCase()}.controller.spec.ts`, renderJestSpec(tag, tagOperations), 'overwrite', 'test'));

    const schemaNames = new Set(tagOperations.flatMap((operation) => [...operation.requestSchemaNames, ...operation.responseSchemaNames]));
    for (const schemaName of [...schemaNames].sort()) {
      const schema = spec.components.schemas[schemaName];
      if (schema) {
        files.push(createManifestFile(`src/${tag.toLowerCase()}/dto/${schemaName}.dto.ts`, renderDto(schemaName, schema), 'overwrite', 'source'));
      }
    }
  }

  const manifest = createFileManifest(files);
  const consistencyReport = assertSpecToRouteConsistency(spec, manifest);
  if (!consistencyReport.ok) {
    throw new Error(`Spec-to-route consistency validation failed: ${consistencyReport.issues.map((issue) => issue.message).join('; ')}`);
  }

  return { manifest, consistencyReport };
};

module.exports = {
  assertSpecToRouteConsistency,
  generateNestJsCode,
};
