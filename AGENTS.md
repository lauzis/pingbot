# Agents Documentation

## Overview
Ping Bot is a GNOME Shell extension that monitors website availability through periodic HTTP pinging with visual status indicators.

## Coding Principles

This project follows industry-standard software engineering principles:

### KISS (Keep It Simple, Stupid)
- Write simple, straightforward code that's easy to understand
- Avoid over-engineering and unnecessary complexity
- Each module has a single, clear purpose
- Methods do one thing and do it well
- Simple solutions are preferred over clever ones

### DRY (Don't Repeat Yourself)
- Single source of truth for all functionality
- IconHelper centralizes all icon logic (no scattered style checks)
- Logger provides one logging interface for the entire extension
- StatusManager is the only place that manages URL statuses
- Code reuse through modular architecture

### Examples in This Codebase:
- **DRY**: IconHelper eliminated 8+ duplicate if/else blocks for icon style checks
- **KISS**: Each lib/ module has <100 lines, focused on one responsibility
- **DRY**: SVG templates stored once in IconHelper, not duplicated across files
- **KISS**: Settings-aware classes hide complexity from consumers
- **DRY**: Network connectivity check happens once in UrlPinger, not per URL

## Project Structure

### Core Components

The extension follows a modular architecture with separate files for different responsibilities:

#### Main Extension (`extension.js`)
- **Type**: Main Extension Coordinator (80 lines)
- **Location**: Root directory
- **Extends**: `Extension` from GNOME Shell
- **Purpose**: Extension lifecycle and module coordination
- **Key Methods**:
  - `enable()`: Activates the extension, initializes all modules with logger
  - `disable()`: Deactivates the extension, cleans up resources
  - `_connectSignals()`: Wires up GSettings change handlers
  - `_updateMainStatus()`: Updates panel icon based on overall status
- **Imports**: All modules from `./lib/` directory
- **Size**: 76% smaller than original monolithic design

#### Logger (`lib/logger.js`)
- **Type**: Logging Utility (37 lines)
- **Location**: `lib/` directory
- **Exports**: `Logger`
- **Purpose**: Centralized logging with debug mode support
- **Key Methods**:
  - `debug(message, context)`: Debug-level logging (only when G_MESSAGES_DEBUG=pingbot)
  - `info(message)`: Info-level logging (always shown)
  - `error(message, error)`: Error logging (always shown)
  - `warn(message)`: Warning logging (always shown)
- **Features**:
  - Auto-detects G_MESSAGES_DEBUG environment variable
  - Silent in production, verbose when debugging
  - Uses GNOME's native log() and logError() functions
  - Structured logging with context objects

#### IconHelper (`lib/iconHelper.js`)
- **Type**: Icon Management Utility (120 lines)
- **Location**: `lib/` directory
- **Exports**: `IconHelper` (class), `IconType` (constants)
- **Purpose**: Settings-aware centralized icon rendering for panel and preferences
- **Constructor**: `new IconHelper(settings, extensionDir, logger)` - requires GSettings, extension directory, and optional logger
- **Key Methods**:
  - `createPanelIcon(iconType)`: Returns icon for panel/menu (BytesIcon or emoji string)
  - `createPrefsIcon(iconType, Gtk)`: Returns widget for preferences (Gtk.Image or Gtk.Label)
  - `updatePrefsIcon(widget, iconType)`: Updates existing preferences widget
  - `getIconStyle()`: Returns current icon style ('symbolic', 'material', or 'emoji')
  - `getIconSize()`: Returns configured icon size
- **Icon Types**: STATUS_GREEN, STATUS_YELLOW, STATUS_RED, ROBOT, REFRESH, SETTINGS
- **Features**:
  - **Settings-aware**: Checks icon-style internally, no caller conditionals needed
  - **Single source of truth**: All icon logic in one place
  - **File-based icons**: Loads SVG files from `icons/symbolic/` and `icons/material/` subdirectories
  - **Theme-aware coloring**: Dynamically replaces hardcoded colors with `currentColor` to inherit theme colors
  - **Extensible**: New icon styles added in one method only
  - **Context-adaptive**: Works for both Shell (St) and GTK4 contexts
  - No inline SVG templates - all assets loaded from icon files

#### StatusManager (`lib/statusManager.js`)
- **Type**: Status Persistence Module (67 lines)
- **Location**: `lib/` directory
- **Exports**: `PingStatus`, `StatusManager`
- **Purpose**: Manages URL status storage and retrieval
- **Key Methods**:
  - `getStatus(url)`: Returns current status for a URL
  - `setStatus(url, status)`: Updates status and saves to GSettings
  - `getOverallStatus(urls)`: Calculates overall status (red if any red, yellow if any yellow, else green)
  - `setAllYellow(urls)`: Batch operation when network is unavailable

#### UrlPinger (`lib/urlPinger.js`)
- **Type**: HTTP Request Module (73 lines)
- **Location**: `lib/` directory
- **Exports**: `UrlPinger`
- **Purpose**: Handles all HTTP pinging and network connectivity
- **Key Methods**:
  - `pingUrl(url, callback)`: Sends HTTP GET request with timeout
  - `pingAll(urls, callback)`: Checks network, then pings all URLs
  - `destroy()`: Aborts all active sessions (prevents memory leaks)
- **Features**:
  - Uses `Gio.NetworkMonitor` for network connectivity check (no external services)
  - Tracks active sessions in Map for proper cleanup
  - Calls `session.abort()` on disable
  - Debug logging for ping operations

#### PingScheduler (`lib/pingScheduler.js`)
- **Type**: Scheduling Module (47 lines)
- **Location**: `lib/` directory
- **Exports**: `PingScheduler`
- **Purpose**: Manages periodic URL pinging
- **Key Methods**:
  - `start()`: Begins periodic pinging based on configured interval
  - `stop()`: Stops pinging and cleans up timeout
  - `_pingAllUrls()`: Triggers URL pings and handles callbacks
- **Features**:
  - GLib timeout management with proper cleanup
  - Coordinates UrlPinger and NotificationManager
  - Triggers notifications on URL failures

#### PanelIndicator (`lib/panelIndicator.js`)
- **Type**: UI Module (125 lines)
- **Location**: `lib/` directory
- **Exports**: `PanelIndicator`
- **Purpose**: Manages panel button and dropdown menu
- **Key Methods**:
  - `updateStatus(status)`: Updates panel icon based on status
  - `buildMenu()`: Rebuilds dropdown menu with URL list
  - `destroy()`: Cleans up UI elements
- **Features**:
  - Uses IconHelper instance (no style conditionals in this file)
  - IconHelper handles Material vs. emoji automatically
  - Click URLs to open in default browser
  - Inline SVG rendering via Gio.BytesIcon

#### NotificationManager (`lib/notificationManager.js`)
- **Type**: Notification Module (38 lines)
- **Location**: `lib/` directory
- **Exports**: `NotificationManager`
- **Purpose**: Handles GNOME desktop notifications
- **Key Methods**:
  - `notifyFailure(url)`: Sends notification when URL fails
- **Features**:
  - Throttles notifications to once per hour
  - Uses MessageTray API
  - Debug logging for notification events

#### PingBotPreferences (`prefs.js`)
- **Type**: Preferences UI Class (210 lines)
- **Location**: Root directory
- **Extends**: `ExtensionPreferences`
- **Purpose**: Manages extension settings and preferences UI
- **UI Framework**: Uses GTK4 (Adw/Gtk)
- **Key Methods**:
  - `fillPreferencesWindow(window)`: Constructs the preferences UI with:
    - Ping interval spin row (1-1440 minutes)
    - URL list with live status indicators
    - Add URL functionality with validation
    - Delete URL buttons for each entry
    - Icon style switcher (Material/Emoji)
- **Features**:
  - Uses IconHelper instance (no style conditionals)
  - Automatically rebuilds list when icon style changes
  - IconHelper creates appropriate widgets (Gtk.Image or Gtk.Label)
  - Live status updates via GSettings signals
- **Validation**: 
  - URL format validation using GLib.Uri.parse()
  - Only HTTP/HTTPS protocols allowed
  - Visual error feedback with CSS styling

### Configuration

#### metadata.json
- **Extension Name**: Ping Bot
- **UUID**: `pingbot@gudlenieks.lv`
- **Target GNOME Shell Version**: 45, 46
- **Description**: Monitor website availability with visual indicators

#### GSettings Schema (`schemas/org.gnome.shell.extensions.pingbot.gschema.xml`)
- **ping-interval** (int): Time between pings in minutes (1-1440)
- **ping-urls** (array of strings): List of URLs to monitor
- **url-statuses** (JSON string): Cached status for each URL (green/yellow/red)

### Resources

#### stylesheet.css
- Error state styling for invalid URL inputs
- Red border and light red background for validation errors

## Features Implementation

### Visual Indicators
- **Panel Icon**: Three-mode support:
  - **Symbolic mode** (default): Custom SVG icons from `icons/symbolic/` directory
  - **Material mode**: Material Design SVG icons from `icons/material/` directory  
  - **Emoji mode**: Robot emoji (🤖) + colored circle emoji (🟢/🟡/🔴)
- **Panel Dropdown**: List of URLs with status icons, click to open in browser
- **Settings List**: URLs with status icons, live updates
- **Icon Style**: User-configurable choice between Symbolic, Material, or Emoji indicators
- **Icon Size**: Adjustable size (10-64px) for panel indicator
- **Icon Files**: All icons loaded from organized `icons/symbolic/` and `icons/material/` subdirectories

### Status Logic
- **Green**: HTTP 200 response received
- **Yellow**: Network unavailable or status unknown
- **Red**: HTTP error or connection failure
- **Panel Priority**: Shows red if ANY URL is red, yellow if ANY is yellow, green if ALL are green

### Monitoring System
- Periodic pinging based on configurable interval
- Network connectivity pre-check using GNOME's native `Gio.NetworkMonitor` API (no external services)
- Async HTTP requests using libsoup
- Status persistence across sessions using GSettings
- Proper session cleanup with `session.abort()` on disable

### Notifications
- GNOME notification sent when URL transitions from working to failed
- Throttled to once per hour to avoid spam
- Uses MessageTray API

### Menu Positioning
- Panel button alignment: 0.5 (centered under icon)
- Menu contains URL list + separator + Settings button

## Development Notes

### Current State
- Full URL monitoring implementation
- Live status updates in panel and preferences
- URL validation with visual feedback
- Network-aware pinging with connectivity checks
- Persistent status storage
- Notification system for failures

### Code Organization
- Modular architecture with separate files for each responsibility
- Standard `lib/` directory structure for helper modules
- `extension.js` (80 lines) - main coordinator (root) ⭐ 76% smaller than original
- `prefs.js` (210 lines) - preferences UI (root) ⭐ REDUCED
- `lib/logger.js` (37 lines) - centralized logging with debug mode
- `lib/iconHelper.js` (120 lines) - **file-based icon management with theme coloring** ⭐ IMPROVED
- `lib/statusManager.js` (67 lines) - status persistence
- `lib/urlPinger.js` (73 lines) - HTTP requests and network checks
- `lib/pingScheduler.js` (47 lines) - periodic ping scheduling
- `lib/panelIndicator.js` (125 lines) - panel UI and menu
- `lib/notificationManager.js` (38 lines) - notifications
- ES6 module imports/exports for clean dependencies
- **IconHelper loads icons from organized subdirectories** (DRY + Maintainable)
- Icon files organized in `icons/symbolic/` and `icons/material/` subdirectories
- Proper resource cleanup in disable() with session.abort()
- Event-driven menu updates via GSettings signals
- Professional logging: silent in production, verbose in debug mode

## Architectural Decisions

### Why These Principles Matter

#### KISS Examples:
1. **Single-purpose modules**: Each lib/ file does one thing (logging, pinging, scheduling)
2. **Settings-aware helpers**: IconHelper knows about settings, callers don't need conditionals
3. **Simple data flow**: Settings → Manager → UI (unidirectional, predictable)
4. **No abstractions until needed**: Started with simple code, refactored when patterns emerged

#### DRY Examples:
1. **IconHelper refactor**: Eliminated 8+ duplicate style checks across files
2. **StatusManager**: Single source of truth for URL status persistence
3. **Logger**: One interface for all logging (debug/info/error/warn)
4. **Network check**: UrlPinger checks connectivity once, not per-URL
5. **SVG templates**: Stored once, reused everywhere with dynamic color injection

#### Benefits Achieved:
- **Maintainability**: Add new icon style in 1 place, not 8+
- **Readability**: Code is self-documenting with clear responsibilities
- **Testability**: Small, focused modules are easier to test
- **Extensibility**: New features fit naturally into existing structure
- **Reduced bugs**: Less code duplication = fewer places for bugs to hide

### Anti-patterns Avoided:
- ❌ God objects (extension.js was 350+ lines, now 80)
- ❌ Scattered conditionals (icon style checks centralized)
- ❌ Copy-paste code (SVG templates stored once)
- ❌ Magic numbers (constants exported from helper modules)
- ❌ Mixed concerns (UI, logic, and data storage separated)

## Dependencies
- GNOME Shell 45/46
- GTK4 (gi://Gtk)
- Adwaita (gi://Adw)
- St (gi://St) - Shell Toolkit
- Gio (gi://Gio) - I/O operations
- GLib (gi://GLib) - Core utilities, URI parsing
- Soup (gi://Soup) - HTTP client library
- MessageTray - Notification system
- PanelMenu - Panel integration
- PopupMenu - Dropdown menu

## Technical Highlights

### Icon System Architecture

**Three Icon Styles Available:**

1. **Symbolic (Default)** - Custom SVG icons from `icons/symbolic/` directory
2. **Material** - Material Design SVG icons from `icons/material/` directory
3. **Emoji** - Unicode emoji characters

**Implementation:**

- **File-based Architecture**: Both symbolic and material styles load SVG files from organized subdirectories
- **Single Source of Truth**: `ICON_FILENAMES` map in IconHelper defines which file to use for each icon type
- **Technology**: `Gio.BytesIcon` with dynamically modified SVG content
- **Theme-aware Coloring**: 
  - Loads SVG files and replaces hardcoded `fill="#hexcolor"` with `fill="currentColor"`
  - Icons automatically inherit the panel text color from the active GNOME Shell theme
  - Works seamlessly with light, dark, and custom themes
  - No manual color configuration needed
- **Why File-based**:
  - Easy to update icons without code changes
  - Designers can work directly with SVG files
  - Better separation of assets and logic (DRY)
  - No hardcoded SVG templates to maintain
- **Benefits**:
  - ✅ Maintainable: Update icons by replacing SVG files
  - ✅ Flexible: Add new icon styles by creating new subdirectories
  - ✅ Clean: No inline SVG code cluttering the codebase
  - ✅ Designer-friendly: Standard SVG workflow
  - ✅ Theme-integrated: Icons match system appearance automatically

**Emoji Style**:
- **Technology**: Unicode text via `St.Label` or `Gtk.Label`
- **Why**: Universal compatibility, colorful, no files needed
- **Icons**: 🤖🟢🟡🔴🔄⚙️
- **Benefits**: Works everywhere, zero dependencies, instant rendering

**Key Decision**: Use file-based icons for professional styles, emoji for simplicity (KISS + Maintainability).

### URL Validation
- Uses `GLib.Uri.parse()` for proper URL parsing
- Protocol whitelist (HTTP/HTTPS only)
- Duplicate detection
- Real-time validation feedback with CSS classes

### Performance
- Async HTTP requests prevent UI blocking
- Network pre-check avoids unnecessary ping attempts
- Status caching reduces redundant checks
- Efficient menu rebuilding only when data changes

### User Experience
- Centered panel dropdown menu
- Click URLs to open in default browser
- Visual error states for invalid input
- Live status updates without manual refresh
- Persistent state across sessions and reboots
