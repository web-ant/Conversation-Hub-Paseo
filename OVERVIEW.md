# Conversation Hub for Paseo

Conversation Hub turns Paseo’s sidebar into an organizer for existing conversations. Keep chats in folders and independent tabs, find recent work, see tasks needing attention, and automatically assign new conversations to folders by their workspace directory. Conversations retain their original host, workspace, history, and files.

## Folders, projects, and tabs

Create folders and one level of subfolders. The folder editor combines the name, icon, color, pin, and linked workspace directories. Choose from 1,858 Lucide icons with search or use an emoji. Pinned folders and conversations appear as additional shortcuts at the top while remaining in their original locations. Unpinning removes the shortcut; deleting a folder keeps its chats.

Drag conversations between folders or arrange them in a custom order. Folders can also be reordered or nested within the supported two levels. Project rows can be reordered without nesting. On touch screens, hold a row and move it; the list scrolls near its edges. To add several existing conversations, use a folder’s **+** and select them from **Current layout** or **Original sources**, grouped by server and workspace.

Custom tabs contain their own folder structures and a selected set of existing conversations, including conversations from different hosts. Closing a tab preserves its contents; reopen it from **View options → Custom tabs**. The selected tab is remembered separately on each device.

Switch between custom folders, projects, servers, or servers with projects. Project appearance supports a display name, icon, emoji, color, and a PNG, JPEG, or WebP image up to 128 KB uploaded from desktop or web. Project names used for display do not rename directories. The **+** on a project starts a new conversation there.

## Recent work and status

**Pinned** keeps chosen conversations at hand. **Recent** shows conversations by actual last activity, excluding pinned conversations. Choose a limit of 5, 10, 15, 20, or 30, or hide the section. Recent and pinned entries remain in their folders and projects.

**In progress** brings together running conversations, approval requests, and finished conversations with unread updates. Subtasks are folded beneath their parent conversation behind a count; approval requests and failures stand out. Search and status filters can show subtasks directly. Background helper agents hidden by Paseo are excluded.

Choose among five running indicators: spinner, orbit, pulse, three dots, and wave bars, with an adjustable color. Folder and project rows can show activity or updates even while folded. Status dots and folded-row indicators can be switched off independently.

Conversation sorting supports last activity, creation time, title, or custom order. Folder sorting is independent: custom order, name, or last activity, ascending or descending. Folder activity includes conversations in subfolders; empty folders stay at the end of activity sorting. Dragging a folder enables custom folder order.

In project grouping, recent conversations load in batches with **Show more**, and activity or creation sorting separates them into time periods. Running conversations keep a stable relative order while replying. **Collapse all → Restore expansion** restores the previous branch states.

## Search, navigation, and actions

Search conversation titles and narrow results by status, host, project, or labels. When the host has the Transcript Search plugin, the search box offers a handoff using the same query for full-history search; this plugin itself searches titles.

**Reveal the open conversation** expands its original folder and scrolls to its row while keeping keyboard focus in the composer. When the conversation is outside the selected custom tab, navigation returns to **All**. Search and filters are preserved, so a filtered-out conversation may remain hidden. Manual folding after navigation is respected until another chat is opened.

Use right-click, the row’s **…** menu, or a touch hold without moving for available actions: rename a conversation or workspace, pin or unpin, edit workspace labels, copy the path or branch, archive a conversation, archive a workspace, or permanently delete a conversation. The menu remains accessible on recent and pinned rows in compact layouts. Archiving and deletion ask for confirmation; workspace actions apply to the workspace and its conversations.

## Automatic folder assignment

Link one or several directories or patterns in the folder editor. New workspaces and conversations are assigned on their host even when the sidebar is closed. Choose whether to include nested directories, Git worktrees using their original repository, or subprocesses. Subprocess assignment is off by default. Rules in custom tabs also add matching new conversations to the tab’s membership.

Plain paths match complete directory boundaries. `*` matches within a directory name; `**` can cross directory boundaries. For example, `/projects/*` matches immediate child directories, `/projects/**` matches all depths, and `**recmeet**` matches paths containing `recmeet`. Rootless patterns can begin at any directory boundary. The nested-directory switch applies to plain paths; patterns define their own depth.

Exact directory matches take priority. Other matches favor more literal text and fewer wildcards. Equally specific matches in different folders leave the conversation unassigned. Manual placement takes priority. Adding or removing a binding does not reorganize existing conversations or move files.

## Appearance and preview

The installed settings page begins with **About the plugin**, showing the icon and a summary. Switch between Russian and English for the description, and use **Read full description** to expand the complete overview. These language tabs do not change the interface language.

Open **View options → Appearance settings…** or the plugin’s appearance settings. Choose English or Russian explicitly, or follow Paseo’s language. Simplified Chinese translations from the original edition are also available when following Paseo. User-created names remain as entered.

Adjust text from 10 to 18 pt, row height, group spacing, nesting indentation, bold group names, icons, status dots, folded-row status, the pinned section, activity timestamps, and one- or two-line titles. The default uses 12 pt text and single-line titles; phone rows retain touch targets of at least 44 px.

The preview uses sample conversations rather than private data. It includes custom tabs, title search, pinned folders and chats, Recent, In progress, nested folders, subtasks, running, approval, error and unread states, and project/server grouping. Changes to appearance, recent limits, sorting, server labels, and background-workspace visibility are reflected in the sample. Scroll to see all sections; expand folders and subtasks or switch sample tabs without changing real chats.

## Setup and saved data

Requires Paseo `>=0.17.3 <0.18.0` on the daemon and clients. Select **Conversation Hub** in **Settings → Sidebar → Sidebar view** on each device. Appearance settings are available under the plugin’s settings. No additional account or token is needed.

Folder structure, membership, pins, project appearance, custom tabs, display preferences, and automatic-assignment rules are saved on the host and update across connected clients. Appearance, language override, open branches, expanded lists, and the selected tab are stored per device. **Reset appearance** preserves folders, conversations, and their order.

The plugin reads conversation and workspace metadata from connected Paseo hosts, saves organization settings, and uses Paseo operations for requested actions. Conversation rename uses the local daemon SDK. Permanent deletion runs the Paseo CLI on the plugin host; Windows uses the CLI bundled with the desktop app. The plugin reads the daemon’s own paseo.pid and local-credential to connect back to that same host for settings and rename operations; these credentials are not sent to external services. Git worktree detection may run a local git rev-parse. Directory bindings do not move files. The plugin does not send organization data to an external service.

## Limitations

Rename and permanent deletion are available for the plugin’s local host; use the original host’s controls for remote conversations. Permanent deletion removes chat history. Manual mark-as-unread and opening a file manager are unavailable through the supported API.

Touch dragging has been checked in a phone-sized browser with simulated touch; physical-device and simultaneous multi-host acceptance remain incomplete. Project tiles may differ from Paseo’s Git-remote-based colors because the plugin cannot read that remote. The preview illustrates settings and sample interactions; it does not run real archive/delete operations, filesystem assignment, or cross-host drag and drop.

Based on [Conversation folders Plus by xiaobaifly7](https://paseo.sh/plugins/xiaobaifly7/conversation-folders-plus), which builds on [Conversation folders by Cocean001](https://github.com/Cocean001/paseo-conversation-folders).
