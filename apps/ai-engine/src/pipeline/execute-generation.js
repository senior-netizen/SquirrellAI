const { createChecksum } = require('../../../../packages/contracts/src');
const { generateNestJsCode } = require('../tools/generate_nestjs_code');
const { generateOpenApiSpec } = require('../tools/generate_openapi_spec');

const executeGeneration = (parsedIntent) => {
  const openApiArtifact = generateOpenApiSpec(parsedIntent);
  const { manifest, consistencyReport } = generateNestJsCode(openApiArtifact.document);

  return {
    executionId: createChecksum(`${openApiArtifact.checksum}:${manifest.files.map((file) => file.checksum).join(':')}`),
    executedAt: new Date().toISOString(),
    parsedIntent,
    normalizedSpecJson: openApiArtifact.json,
    normalizedSpecChecksum: openApiArtifact.checksum,
    fileManifest: manifest,
    consistencyReport,
  };
};

module.exports = {
  executeGeneration,
};
