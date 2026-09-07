(function (root) {
  'use strict';
  const emailPattern = /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  function uniqueEmail(text) {
    const emails = [...new Set((text.match(emailPattern) || []).map(value => value.toLowerCase()))];
    return emails.length === 1 ? emails[0] : null;
  }
  function validId(value) {
    return typeof value === 'string' && /^[a-f0-9]{10,32}$/i.test(value);
  }
  function cleanPins(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.filter(pin => {
      if (!pin || !validId(pin.id) || seen.has(pin.id)) return false;
      seen.add(pin.id);
      return true;
    }).slice(0, 200).map(pin => ({
      id: pin.id,
      subject: typeof pin.subject === 'string' ? pin.subject.slice(0, 300) : '(No subject)',
      sender: typeof pin.sender === 'string' ? pin.sender.slice(0, 150) : '',
      createdAt: Number.isFinite(pin.createdAt) ? pin.createdAt : 0
    }));
  }
  function keyFor(account) { return `pitt:v1:${account}`; }
  function conversationUrl(path, id) {
    if (!validId(id) || !/^\/mail\/u\/\d+\/$/.test(path)) return null;
    return `${path}#all/${id}`;
  }
  const api = { uniqueEmail, validId, cleanPins, keyFor, conversationUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PiTTCore = api;
})(globalThis);
