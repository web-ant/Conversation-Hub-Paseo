# Paseo registry submission

- Display name: **Conversation Hub**.
- Requested listing ID: **web-ant/conversation-hub**; final ID is assigned during registry review.
- Source: https://github.com/web-ant/Conversation-Hub-Paseo
- Release reference: `v0.3.0`.
- Main category: **Sidebar**.
- Runtime manifest ID: `conversation-folders-plus`, retained for the existing settings and routing contract. The registry listing ID and runtime ID serve different purposes.
- License: **MIT**, with original copyright notices preserved.

## Listing material

- English overview: [OVERVIEW.md](OVERVIEW.md).
- Russian overview: [OVERVIEW.ru.md](OVERVIEW.ru.md).
- English README: [README.md](README.md).
- Russian README: [README.ru.md](README.ru.md).
- Icon: [assets/icon.png](assets/icon.png).
- English feature screenshot: [assets/screenshots/features-en.png](assets/screenshots/features-en.png).
- Russian feature screenshot: [assets/screenshots/features-ru.png](assets/screenshots/features-ru.png).
- Current desktop and compact settings screenshots are declared in `paseo-plugin.json`.

The manifest supplies an English default description and a Russian translation. The overview and icon are embedded in the plugin settings as well as included as listing assets. No dependency installation or preparation commands run when the plugin is installed; Paseo compiles the committed runtime sources.

## Attribution

Based on [Conversation folders Plus by xiaobaifly7](https://paseo.sh/plugins/xiaobaifly7/conversation-folders-plus), which builds on [Conversation folders by Cocean001](https://github.com/Cocean001/paseo-conversation-folders). Upstream Git history is preserved.

## Submission and installation state

Use the [official submission form](https://github.com/getpaseo/plugins/issues/new?template=submit-plugin.yml), set the title to `Conversation Hub`, provide the source above with the release reference, and select **Sidebar**.

Submitting creates a review request; it does not publish the listing immediately. The registry maintainers review and pin an exact commit. After approval, install through the published registry ID to use the registry icon in Paseo’s installed-plugin list. Direct Git installation alone does not link that list item to the registry.

Do not remove a local installation as a migration shortcut: plugin removal deletes saved settings. Preserve the existing local installation until the listing is published and its source migration is handled separately.
