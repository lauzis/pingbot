# Changelog

All notable changes to Ping Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.10] - 2026-07-29

### Added
- Extension name and version shown in a footer at the bottom of the preferences window
- `version-name` in `metadata.json`, so the release is displayed as `1.0.10` rather than the bare upload counter

## [1.0.9] - 2026-07-28

**Note**: Version 1.0.8 was rejected by GNOME Shell Extensions review. Changes below address the reviewer's feedback.

### Fixed
- Settings signals now use `connectObject()`/`disconnectObject()`, so all handlers are tracked against their owner and released in a single call
- Corrected `donations` values in `metadata.json` to bare usernames, as required by the metadata specification (they previously held full URLs)
- Development tooling directory `.claude/` is no longer packaged into the release zip

## [1.0.8] - 2026-07-03

### Fixed
- Settings signal handlers connected in `enable()` are now properly disconnected in `disable()`, per GNOME Shell extension review guidelines

## [1.0.7] - 2026-06-30

### Added
- IP/ICMP ping monitoring — monitor any device by IP address (IPv4, IPv6) or hostname using ICMP ping, no web server required
- GNOME Shell 50 support
- Type selector (HTTP / Ping) in the preferences add-target row

### Fixed
- Cancelled pings during extension teardown no longer emit false RED transitions or failure notifications
- Overlapping pings for the same target now correctly cancel the previous in-flight ping before starting a new one
- Ping target validation now rejects URLs and paths (e.g. `https://…` or `host/path`) entered in the Ping field

## [1.0.6] - 2026-02-14

### Added
- Separated CHANGELOG.md from README for better documentation structure
- 3 icon style options: Freeicons (default), Material Design, and Emoji
- User-configurable icon style in preferences
- Configurable icon size (10-64px) for panel indicator, default is 22px

### Changed
- Material icons now inherit theme's foreground color for better integration
- Green status uses theme text color, while red/yellow use warning colors
- Icons use SVG with `currentColor` for proper theme support
- README.md now cleaner and more scannable (reduced by 24%)

## [1.0.5] - 2026-02-02

**Note**: Version 1.0.5 was skipped - rejected by GNOME Shell Extensions review. Features released as 1.0.6 instead.

## [1.0.4] - 2026-01-05

### Added
- "Force Recheck" option in the panel menu to immediately refresh all URL statuses

## [1.0.3] - 2025-11-22

### Added
- Debug logging for settings changes (URL list updates, interval changes)
- Debug logging for scheduler events (start, stop, timer trigger)

### Changed
- Relaxed network check to allow local network monitoring (was requiring full internet)
- Updated metadata for GNOME Shell 47+ support

### Fixed
- Adding URLs or changing interval now triggers immediate update
- Improved logging context for easier debugging

### Tested
- Ubuntu 24.10 (GNOME 47)
- Ubuntu 25.04 (GNOME 48)
- Ubuntu 25.10 (GNOME 49)

## [1.0.2] - 2025-11-13

### Added
- Extension icon (128x128 PNG) generated from favicon
- `release.sh` script for automated release packaging
  - Excludes development files (.git, .idea, git-images, etc.)
  - Creates clean zip ready for distribution

### Changed
- Replaced Mozilla portal network check with native GNOME `Gio.NetworkMonitor` API
  - More reliable network connectivity detection
  - No external HTTP requests for connectivity checks
  - Uses GNOME's built-in network monitoring system
- Refactored code into modular architecture
  - Created `lib/` directory for helper modules
  - Split extension.js into 6 focused modules:
    - `logger.js` - Centralized logging with debug mode
    - `statusManager.js` - Status persistence
    - `urlPinger.js` - HTTP requests
    - `pingScheduler.js` - Periodic scheduling
    - `panelIndicator.js` - Panel UI & menu
    - `notificationManager.js` - Notifications
  - Main class reduced by 76% (317 to 80 lines)
  - Better code organization and maintainability

### Improved
- Resource management
  - Proper timeout cleanup before creating new ones
  - Session tracking with `session.abort()` on disable
  - Prevents memory leaks from pending HTTP requests
- Professional logging system
  - Silent in production (only lifecycle + errors)
  - Verbose debug mode: `G_MESSAGES_DEBUG=pingbot`
  - Uses GNOME's native logging functions
  - Respects privacy (no URL logging by default)

## [1.0.1] - 2025-11

### Added
- Initial release
- Panel icon with robot emoji and colored status indicator
- Click panel icon to see dropdown menu with all monitored URLs
- Click URLs in dropdown to open in default browser
- Settings page with URL management (add/delete)
- Real-time status updates with colored emoji indicators (green/yellow/red)
- Configurable ping interval (1-1440 minutes)
- Network connectivity detection before pinging
- URL validation (only HTTP/HTTPS allowed)
- Visual error feedback for invalid URLs
- Persistent status storage across sessions
- GNOME notifications for failures (once per hour)
- Support for GNOME Shell 45/46
