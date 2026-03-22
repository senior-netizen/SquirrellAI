module.exports = {
  ...require('./pipeline/execute-generation'),
  ...require('./tools/generate_nestjs_code'),
  ...require('./tools/generate_openapi_spec'),
};
