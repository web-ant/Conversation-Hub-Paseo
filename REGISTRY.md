# Paseo registry submission

- Display name: **Conversation Hub**.
- Requested listing ID: **web-ant/conversation-hub**; final ID is assigned during registry review.
- Source: https://github.com/web-ant/Conversation-Hub-Paseo
- Release reference: `v0.3.1`.
- Main category: **Sidebar**.
- Runtime manifest ID: `conversation-hub`. Version 0.3.1 changes the default ID for new installations; existing installation settings are not migrated automatically.
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

The manifest supplies an English default description and a Russian translation. The overview and icon are embedded in the plugin settings as well as included as listing assets. For Git installations, Paseo installs the server dependencies from `package-lock.json` without running dependency lifecycle scripts, then compiles the committed runtime sources. The daemon host needs npm and access to its registry.

## Attribution

Based on [Conversation folders Plus by xiaobaifly7](https://paseo.sh/plugins/xiaobaifly7/conversation-folders-plus), which builds on [Conversation folders by Cocean001](https://github.com/Cocean001/paseo-conversation-folders). Original human commit authors and copyright notices are preserved.

## Submission and installation state

Submitted as [issue #3432](https://github.com/getpaseo/plugins/issues/3432). The intake bot opened [review PR #3433](https://github.com/getpaseo/plugins/pull/3433) initially for release commit `15ab2a582bd0294ec1c7e0a1468f1c687301f141` (`v0.3.0`). The current release reference is `v0.3.1`, with manifest ID `conversation-hub`. Publication is pending registry review.

Use the [official submission form](https://github.com/getpaseo/plugins/issues/new?template=submit-plugin.yml), set the title to `Conversation Hub`, provide the source above with the release reference, and select **Sidebar**.

Submitting creates a review request; it does not publish the listing immediately. The registry maintainers review and pin an exact commit. After approval, install through the published registry ID to use the registry icon in Paseo’s installed-plugin list. Direct Git installation alone does not link that list item to the registry.

Do not remove a local installation as a migration shortcut: plugin removal deletes saved settings. Preserve the existing local installation until the listing is published and its source migration is handled separately.
