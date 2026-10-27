process.env.NODE_ENV = 'test';
process.env.STORAGE_MODE = 'json';
process.env.JWT_SECRET = 'test_suite_cryptographically_secure_jwt_secret_key_12345';
process.env.PORT = '5098';
process.env.GEMINI_API_KEY = ''; // Disables live external network latency during automated testing

const { app } = require('../src/index');

module.exports = { app };
