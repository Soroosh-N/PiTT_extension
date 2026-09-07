# PiTT — Pin to the Top for Gmail

A small Chrome extension that keeps pinned conversation shortcuts above your Gmail inbox. Pins stay local to your browser and do not change Gmail's ordering or labels.

## Install

1. On this GitHub page, click **Code → Download ZIP** and extract it.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Refresh Gmail and click the pin icon beside a conversation. Click it again to unpin.

Keep the extracted folder on your computer. To update, replace its files with the latest download, click **Reload** on PiTT's extension card, and refresh Gmail.

## What to expect

- Desktop Gmail only, with up to 200 pins per account.
- Pins persist across browser restarts and remain after archiving. Remove outdated shortcuts manually; sender and subject snapshots do not update.
- Experimental: live Gmail compatibility has not yet been verified. Gmail layout changes may break pin controls, and simultaneous edits in multiple tabs may overwrite one another.

## Privacy

Account addresses and pinned conversation details are stored locally in Chrome, without additional encryption. No backend, analytics, or Chrome Sync. See [PRIVACY.md](PRIVACY.md) for details.

## Development

Run checks with `node --test tests/core.test.cjs` (requires Node.js).

No open-source license has been selected yet.
