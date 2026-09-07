# PiTT privacy

PiTT adds locally saved shortcuts to Gmail conversations. This policy describes version 0.1.0.

## Data accessed and stored

PiTT reads the current Gmail account address from the account control to keep different accounts' pins separate. For conversations you pin, it stores the conversation identifier, sender display text, subject, and pin timestamp in Chrome's local extension storage. It reads inbox row information to provide pin controls. It does not intentionally read or store message bodies or attachments.

## Use and sharing

This information is used only to display and manage pinned conversation shortcuts. PiTT has no backend, analytics, advertisements, or telemetry and does not transmit stored information to the developer or third parties. It does not use Chrome Sync storage. Opening a pinned conversation navigates to Gmail and is subject to Google's handling of that navigation.

## Retention and deletion

Pins remain in the local Chrome profile until you unpin them or uninstall the extension. Unpinning deletes that conversation's saved record. Uninstalling removes the extension's local storage. PiTT does not provide additional encryption for that storage.
