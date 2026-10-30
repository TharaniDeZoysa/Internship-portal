// Small helper so controllers can `throw httpError(404, "Not found")`.
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = httpError;
