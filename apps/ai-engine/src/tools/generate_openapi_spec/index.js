const { createChecksum } = require('../../../../../packages/contracts/src');

const normalizeArray = (value) =>
  [...value]
    .map((entry) => deepSort(entry))
    .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));

const normalizeObject = (value) =>
  Object.keys(value)
    .sort((left, right) => left.localeCompare(right))
    .reduce((accumulator, key) => {
      if (value[key] !== undefined) {
        accumulator[key] = deepSort(value[key]);
      }
      return accumulator;
    }, {});

const deepSort = (value) => {
  if (Array.isArray(value)) {
    return normalizeArray(value);
  }

  if (value !== null && typeof value === 'object') {
    return normalizeObject(value);
  }

  return value;
};

const stableStringify = (value) => JSON.stringify(deepSort(value), null, 2);

const createParameterObjects = (fields, location) =>
  fields.map((field) => ({
    in: location,
    name: field.name,
    required: location === 'path' ? true : Boolean(field.required),
    description: field.description,
    schema: {
      type: field.type,
    },
  }));

const createSchemaRef = (schemaName) => ({
  $ref: `#/components/schemas/${schemaName}`,
});

const toOpenApiSchema = (intent) =>
  intent.schemas.reduce((schemas, schema) => {
    schemas[schema.name] = {
      type: 'object',
      description: schema.description,
      required: schema.fields.filter((field) => field.required).map((field) => field.name),
      properties: schema.fields.reduce((properties, field) => {
        properties[field.name] = {
          type: field.type,
          description: field.description,
        };
        return properties;
      }, {}),
    };
    return schemas;
  }, {});

const validateReference = (schemaName, availableSchemas, message) => {
  if (!availableSchemas.has(schemaName)) {
    throw new Error(`${message}: ${schemaName}`);
  }
};

const validateOpenApiDocument = (document) => {
  if (document.openapi !== '3.0.3') {
    throw new Error(`Unsupported OpenAPI version: ${document.openapi}`);
  }

  if (!document.info.title || !document.info.version) {
    throw new Error('OpenAPI info block requires title and version.');
  }

  const schemaNames = new Set(Object.keys(document.components.schemas));
  if (schemaNames.size === 0) {
    throw new Error('OpenAPI document must expose at least one schema.');
  }

  for (const [path, pathItem] of Object.entries(document.paths)) {
    if (!path.startsWith('/')) {
      throw new Error(`Path must start with '/': ${path}`);
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }

      if (Object.keys(operation.responses).length === 0) {
        throw new Error(`Operation ${operation.operationId} must define responses.`);
      }

      const requestSchemaName = operation.requestBody?.content?.['application/json']?.schema?.$ref?.split('/').at(-1);
      if (requestSchemaName) {
        validateReference(requestSchemaName, schemaNames, `Request schema missing for ${operation.operationId}`);
      }

      for (const response of Object.values(operation.responses)) {
        const schemaName = response.content?.['application/json']?.schema?.$ref?.split('/').at(-1);
        if (schemaName) {
          validateReference(schemaName, schemaNames, `Response schema missing for ${operation.operationId}`);
        }
      }
    }
  }
};

const generateOpenApiSpec = (intent) => {
  const document = {
    openapi: '3.0.3',
    info: {
      title: intent.serviceName,
      version: intent.version,
      description: intent.serviceDescription,
    },
    tags: [...new Set(intent.routes.map((route) => route.tag))].map((name) => ({ name })),
    paths: intent.routes.reduce((paths, route) => {
      const parameters = [
        ...(route.pathParams ? createParameterObjects(route.pathParams, 'path') : []),
        ...(route.queryParams ? createParameterObjects(route.queryParams, 'query') : []),
      ];

      const operation = {
        operationId: route.operationId,
        summary: route.summary,
        description: route.description,
        tags: [route.tag],
        ...(parameters.length > 0 ? { parameters } : {}),
        ...(route.requestBodySchemaName
          ? {
              requestBody: {
                required: true,
                content: {
                  'application/json': {
                    schema: createSchemaRef(route.requestBodySchemaName),
                  },
                },
              },
            }
          : {}),
        responses: route.responseSchemas.reduce((responses, response) => {
          responses[String(response.statusCode)] = {
            description: response.description,
            ...(response.schemaName
              ? {
                  content: {
                    'application/json': {
                      schema: createSchemaRef(response.schemaName),
                    },
                  },
                }
              : {}),
          };
          return responses;
        }, {}),
      };

      paths[route.path] = {
        ...(paths[route.path] ?? {}),
        [route.method]: operation,
      };
      return paths;
    }, {}),
    components: {
      schemas: toOpenApiSchema(intent),
    },
  };

  const normalizedDocument = deepSort(document);
  validateOpenApiDocument(normalizedDocument);
  const json = stableStringify(normalizedDocument);

  return {
    document: normalizedDocument,
    json,
    checksum: createChecksum(json),
  };
};

module.exports = {
  generateOpenApiSpec,
  stableStringify,
  validateOpenApiDocument,
};
