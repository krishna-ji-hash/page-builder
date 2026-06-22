import assert from 'node:assert/strict';
import {
  buildMysqlBaseConfig,
  resolveMysqlSsl,
  shouldUseMysqlSsl,
} from '../lib/mysqlPoolOptions.js';

const prev = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in prev)) delete process.env[key];
  }
  Object.assign(process.env, prev);
}

try {
  delete process.env.MYSQL_SSL;
  assert.equal(shouldUseMysqlSsl('127.0.0.1'), false);
  assert.equal(shouldUseMysqlSsl('mysql-abc.e.aivencloud.com'), true);
  assert.equal(resolveMysqlSsl('127.0.0.1'), undefined);

  process.env.MYSQL_SSL = 'true';
  assert.equal(shouldUseMysqlSsl('127.0.0.1'), true);
  assert.deepEqual(resolveMysqlSsl('127.0.0.1'), { rejectUnauthorized: false });

  process.env.MYSQL_SSL = 'false';
  assert.equal(shouldUseMysqlSsl('mysql-abc.e.aivencloud.com'), false);

  delete process.env.MYSQL_SSL;
  const aivenSsl = resolveMysqlSsl('mysql-abc.e.aivencloud.com');
  assert.equal(aivenSsl?.rejectUnauthorized, false);

  process.env.MYSQL_SSL_REJECT_UNAUTHORIZED = 'true';
  assert.equal(resolveMysqlSsl('mysql-abc.e.aivencloud.com').rejectUnauthorized, true);

  delete process.env.MYSQL_SSL_REJECT_UNAUTHORIZED;
  const localConfig = buildMysqlBaseConfig({ host: '127.0.0.1' });
  assert.equal(localConfig.ssl, undefined);

  const cloudConfig = buildMysqlBaseConfig({ host: 'mysql-abc.e.aivencloud.com' });
  assert.deepEqual(cloudConfig.ssl, { rejectUnauthorized: false });
} finally {
  restoreEnv();
}

console.log('mysqlPoolOptions.test.mjs: ok');
