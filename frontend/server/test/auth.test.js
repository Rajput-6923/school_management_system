import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

test('password hashes are verifiable and do not equal the original password', async () => {
  const password = 'correct horse battery staple';
  const hash = await bcrypt.hash(password, 4);
  assert.notEqual(hash, password);
  assert.equal(await bcrypt.compare(password, hash), true);
  assert.equal(await bcrypt.compare('incorrect password', hash), false);
});
