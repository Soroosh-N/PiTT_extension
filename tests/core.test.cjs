const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('account detection rejects ambiguous and missing addresses', () => {
  assert.equal(core.uniqueEmail('Google Account: Person (person@example.com)'), 'person@example.com');
  assert.equal(core.uniqueEmail('a@example.com b@example.com'), null);
  assert.equal(core.uniqueEmail('Google Account'), null);
  assert.notEqual(core.keyFor('a@example.com'), core.keyFor('b@example.com'));
});
test('stored data is validated, deduplicated and bounded', () => {
  const pin = { id: '1234567890abcdef', subject: 'x'.repeat(400), sender: 'Sender', createdAt: 10 };
  const pins = core.cleanPins([null, {}, { id: 'javascript:alert(1)' }, pin, pin]);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].subject.length, 300);
  assert.deepEqual(core.cleanPins({}), []);
});
test('conversation links stay within the active Gmail account path', () => {
  assert.equal(core.conversationUrl('/mail/u/2/', '1234567890abcdef'), '/mail/u/2/#all/1234567890abcdef');
  assert.equal(core.conversationUrl('//evil.example/', '1234567890abcdef'), null);
  assert.equal(core.conversationUrl('/mail/u/0/', '../bad'), null);
});
