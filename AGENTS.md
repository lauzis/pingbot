# Agents Documentation

## Overview
Ping Bot is a GNOME Shell extension that monitors website availability through periodic HTTP pinging with visual status indicators.

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
- **Type**: UI Module (85 lines)
- **Location**: `lib/` directory
- **Exports**: `PanelIndicator`
- **Purpose**: Manages panel button and dropdown menu
- **Key Methods**:
  - `updateStatus(status)`: Updates panel icon emoji
  - `buildMenu()`: Rebuilds dropdown menu with URL list
  - `destroy()`: Cleans up UI elements
- **Features**:
  - Robot emoji with colored status indicator
  - Click URLs to open in default browser
  - Settings menu item
  - Error logging for failures

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
- **Type**: Preferences UI Class (245 lines)
- **Location**: Root directory
- **Extends**: `ExtensionPreferences`
- **Purpose**: Manages extension settings and preferences UI
- **UI Framework**: Uses GTK4 (Adw/Gtk)
- **Key Methods**:
  - `fillPreferencesWindow(window)`: Constructs the preferences UI with:
    - Ping interval spin row (1-1440 minutes)
    - URL list with live status indicators (emoji-based)
    - Add URL functionality with validation
    - Delete URL buttons for each entry
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
- **Panel Icon**: Robot emoji (🤖) + colored circle emoji (🟢/🟡/🔴)
- **Panel Dropdown**: List of URLs with status emojis, click to open in browser
- **Settings List**: URLs with colored circle emojis, live updates

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
- `prefs.js` (245 lines) - preferences UI (root)
- `lib/logger.js` (37 lines) - centralized logging with debug mode
- `lib/statusManager.js` (67 lines) - status persistence
- `lib/urlPinger.js` (73 lines) - HTTP requests and network checks
- `lib/pingScheduler.js` (47 lines) - periodic ping scheduling
- `lib/panelIndicator.js` (85 lines) - panel UI and menu
- `lib/notificationManager.js` (38 lines) - notifications
- ES6 module imports/exports for clean dependencies
- Emoji-based visual indicators (no SVG loading in runtime)
- Proper resource cleanup in disable() with session.abort()
- Event-driven menu updates via GSettings signals
- Professional logging: silent in production, verbose in debug mode

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
