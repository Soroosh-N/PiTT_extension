(() => {
  'use strict';
  const { uniqueEmail, validId, cleanPins, keyFor, conversationUrl } = globalThis.PiTTCore;
  let account = null;
  let pins = [];
  let loaded = false;
  let generation = 0;
  let timer;
  let panel;
  let signature = '';
  let pending = false;
  let error = '';
  const path = () => location.pathname.match(/^\/mail\/u\/\d+\//)?.[0];

  // Only inspect account controls, never message content or the account chooser.
  // Fail closed if Gmail doesn't expose one unambiguous current address.
  function currentAccount() {
    const candidates = [...document.querySelectorAll('a[href*="accounts.google.com/SignOutOptions"], a[aria-label][href*="accounts.google.com"]')];
    const addresses = candidates.filter(node => node.getClientRects().length).map(node =>
      uniqueEmail(`${node.getAttribute('aria-label') || ''} ${node.getAttribute('title') || ''}`)
    ).filter(Boolean);
    const unique = [...new Set(addresses)];
    return unique.length === 1 ? unique[0] : null;
  }

  function rowData(row) {
    const node = row.matches('[data-legacy-thread-id]') ? row : row.querySelector('[data-legacy-thread-id]');
    let id = node?.getAttribute('data-legacy-thread-id');
    if (!validId(id)) {
      for (const link of row.querySelectorAll('a[href]')) {
        const url = new URL(link.href, location.href);
        if (url.origin !== location.origin) continue;
        const candidate = url.hash.split('/').pop();
        if (validId(candidate)) { id = candidate; break; }
      }
    }
    if (!validId(id)) return null;
    return {
      id,
      subject: (row.querySelector('.bog')?.textContent || '(No subject)').trim().slice(0, 300),
      sender: (row.querySelector('.yW [email]')?.getAttribute('name') || row.querySelector('.yW')?.textContent || '').trim().slice(0, 150),
      createdAt: Date.now()
    };
  }

  function button(label, handler) {
    const result = document.createElement('button');
    result.type = 'button';
    result.setAttribute('aria-label', label);
    result.title = label;
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shape.setAttribute('d', 'M8 3h8v2l-1 1v5l3 3v2h-5v5l-1 2-1-2v-5H6v-2l3-3V6L8 5Z');
    icon.append(shape);
    result.append(icon);
    result.addEventListener('click', handler);
    return result;
  }

  async function toggle(pin) {
    if (!loaded || pending || currentAccount() !== account) return;
    const savedAccount = account;
    const savedGeneration = generation;
    const exists = pins.some(item => item.id === pin.id);
    if (!exists && pins.length >= 200) {
      error = 'You have 200 pins. Unpin a conversation to add another.';
      schedule();
      return;
    }
    pending = true;
    error = '';
    schedule();
    try {
      // Re-read before each write to reduce conflicts with other Gmail tabs.
      const key = keyFor(savedAccount);
      const stored = await chrome.storage.local.get(key);
      if (savedGeneration !== generation || currentAccount() !== savedAccount) return;
      const latest = cleanPins(stored[key]);
      const next = exists ? latest.filter(item => item.id !== pin.id)
        : latest.some(item => item.id === pin.id) ? latest : cleanPins([pin, ...latest]);
      await chrome.storage.local.set({ [key]: next });
      if (savedGeneration === generation) pins = next;
    } catch {
      if (savedGeneration === generation) error = 'PiTT could not save this change. Refresh Gmail and try again.';
    } finally {
      pending = false;
      schedule();
    }
  }

  function renderPanel(main) {
    if ((!loaded || !pins.length) && !error) {
      panel?.remove();
      signature = '';
      return;
    }
    if (!panel?.isConnected || panel.parentElement !== main) {
      panel?.remove();
      panel = document.createElement('section');
      panel.className = 'pitt-panel';
      panel.setAttribute('aria-label', 'Pinned conversations');
      main.prepend(panel);
      signature = '';
    }
    const nextSignature = JSON.stringify([account, loaded, pins, error, pending, path()]);
    if (signature === nextSignature) return;
    signature = nextSignature;
    const heading = document.createElement('h2');
    heading.textContent = `Pinned${loaded ? ` · ${pins.length}` : ''}`;
    const children = pins.length ? [heading] : [];
    if (error) {
      const notice = document.createElement('p');
      notice.setAttribute('role', 'alert');
      notice.textContent = error;
      children.push(notice);
    }
    if (loaded && pins.length) {
      const list = document.createElement('ul');
      for (const pin of pins) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = conversationUrl(path(), pin.id);
        const sender = document.createElement('span');
        sender.className = 'pitt-sender';
        sender.textContent = pin.sender;
        const subject = document.createElement('span');
        subject.textContent = pin.subject;
        link.append(sender, subject);
        const remove = button('Unpin', () => toggle(pin));
        remove.setAttribute('aria-label', `Unpin ${pin.subject}`);
        remove.setAttribute('aria-pressed', 'true');
        remove.disabled = pending;
        item.append(link, remove);
        list.append(item);
      }
      children.push(list);
    }
    panel.replaceChildren(...children);
  }

  async function updateAccount(next) {
    account = next;
    pins = [];
    loaded = false;
    error = '';
    const token = ++generation;
    if (!next) return;
    try {
      const key = keyFor(next);
      const result = await chrome.storage.local.get(key);
      if (token !== generation) return;
      pins = cleanPins(result[key]);
      loaded = true;
    } catch {
      if (token === generation) error = 'PiTT could not load your pins. Refresh Gmail to try again.';
    }
    schedule();
  }

  function refresh() {
    const next = currentAccount();
    if (next !== account) void updateAccount(next);
    const inbox = /^#inbox(?:\/|$)/.test(location.hash) || !location.hash;
    const main = [...document.querySelectorAll('[role="main"]')].find(node => node.getClientRects().length);
    // A conversation opened from the inbox also has an #inbox/... URL.
    const listView = main && (main.querySelector('tr.zA') || location.hash === '#inbox' || !location.hash);
    if (!path() || !inbox || !listView) {
      panel?.remove();
      document.querySelectorAll('.pitt-pin').forEach(node => node.remove());
      return;
    }
    renderPanel(main);
    for (const row of main.querySelectorAll('tr.zA')) {
      const pin = rowData(row);
      let control = row.querySelector('.pitt-pin');
      if (!pin || !loaded) { control?.remove(); continue; }
      if (!control) {
        const cell = row.querySelector('td.xY') || row.querySelector('td');
        if (!cell) continue;
        control = button('', event => {
          event.preventDefault();
          event.stopPropagation();
          const current = rowData(row);
          if (current) void toggle(current);
        });
        control.className = 'pitt-pin';
        for (const type of ['mousedown', 'mouseup', 'dblclick', 'keydown', 'keyup']) {
          control.addEventListener(type, event => event.stopPropagation());
        }
        cell.append(control);
      }
      const active = pins.some(item => item.id === pin.id);
      const label = active ? 'Unpin' : 'Pin';
      if (control.title !== label) control.title = label;
      const accessible = `${label} ${pin.subject}`;
      if (control.getAttribute('aria-label') !== accessible) control.setAttribute('aria-label', accessible);
      if (control.getAttribute('aria-pressed') !== String(active)) control.setAttribute('aria-pressed', String(active));
      control.disabled = pending;
    }
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => { timer = null; refresh(); }, 150);
  }
  new MutationObserver(records => {
    if (records.some(record => !record.target.closest?.('.pitt-panel, .pitt-pin'))) schedule();
  }).observe(document.body, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['aria-label', 'data-legacy-thread-id', 'href'] });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !account || !changes[keyFor(account)]) return;
    pins = cleanPins(changes[keyFor(account)].newValue);
    schedule();
  });
  window.addEventListener('hashchange', schedule);
  window.addEventListener('popstate', schedule);
  schedule();
})();
