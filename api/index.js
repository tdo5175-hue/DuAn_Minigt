const app = require('../server/server');

module.exports = (req, res) => {
  const originalUrl = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'];
  if (originalUrl) {
    req.url = originalUrl;
  }
  return app(req, res);
};
