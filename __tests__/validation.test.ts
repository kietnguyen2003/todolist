import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateLogin } from '../src/validation.ts';

test('requires both fields, including whitespace-only input', () => {
  for (const value of ['', '   ']) {
    assert.deepEqual(validateLogin(value, value), {
      email: 'Bạn chưa nhập email.',
      password: 'Bạn chưa nhập mật khẩu.',
    });
  }
});

test('rejects malformed email addresses', () => {
  for (const email of ['hello', 'a@', '@example.com', 'a b@example.com', 'a@example', 'a@@example.com']) {
    assert.equal(validateLogin(email, 'example').email, 'Email chưa đúng định dạng. Ví dụ: ban@email.com');
  }
});

test('accepts valid email, trims surrounding spaces, does not require a password length', () => {
  for (const email of ['ban@email.com', '  hello+todo@example.co.vn  ']) {
    assert.deepEqual(validateLogin(email, 'x'), {});
  }
});

test('reports only the field that needs attention', () => {
  assert.deepEqual(validateLogin('ban@email.com', ''), { password: 'Bạn chưa nhập mật khẩu.' });
  assert.deepEqual(validateLogin('', 'secret'), { email: 'Bạn chưa nhập email.' });
});
