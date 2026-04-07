const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

module.exports = async () => {
  const rootDir = path.resolve(__dirname, '../..');
  const envPath = path.join(rootDir, '.env.test');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }

  process.env.NODE_ENV = process.env.NODE_ENV || 'test';

  execSync('yarn migration:run:test', {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
  });
};
