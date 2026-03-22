const { createHash } = require('node:crypto');

/** @typedef {'get' | 'post' | 'put' | 'patch' | 'delete'} HttpMethod */
/** @typedef {'string' | 'number' | 'integer' | 'boolean'} PrimitiveSchemaType */
/** @typedef {'overwrite' | 'skip-if-exists' | 'error-if-exists'} OverwritePolicy */
/** @typedef {'source' | 'test' | 'artifact'} ArtifactKind */

/**
 * @typedef {Object} ManifestFile
 * @property {string} relativePath
 * @property {string} contents
 * @property {string} checksum
 * @property {OverwritePolicy} overwritePolicy
 * @property {ArtifactKind} kind
 */

/**
 * @typedef {Object} FileManifest
 * @property {'1.0'} formatVersion
 * @property {readonly ManifestFile[]} files
 */

const createChecksum = (value) => createHash('sha256').update(value).digest('hex');

/**
 * @param {string} relativePath
 * @param {string} contents
 * @param {OverwritePolicy} overwritePolicy
 * @param {ArtifactKind} kind
 * @returns {ManifestFile}
 */
const createManifestFile = (relativePath, contents, overwritePolicy, kind) => ({
  relativePath,
  contents,
  checksum: createChecksum(contents),
  overwritePolicy,
  kind,
});

/** @param {readonly ManifestFile[]} files @returns {FileManifest} */
const createFileManifest = (files) => ({
  formatVersion: '1.0',
  files: [...files].sort((left, right) => left.relativePath.localeCompare(right.relativePath)),
});

module.exports = {
  createChecksum,
  createManifestFile,
  createFileManifest,
};
