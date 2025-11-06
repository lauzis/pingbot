# Agents Documentation

## Overview
Ping Bot is a GNOME Shell extension that monitors website availability through periodic HTTP pinging with visual status indicators.

## Project Structure

### Core Components

#### PingBotExtension (`extension.js`)
- **Type**: Main Extension Class
- **Extends**: `Extension` from GNOME Shell
- **Purpose**: Core extension lifecycle management and URL monitoring
- **Key Methods**:
  - `enable()`: Activates the extension, loads cached statuses, starts pinging
  - `disable()`: Deactivates the extension, cleans up resources
  - `_buildMenu()`: Constructs panel dropdown menu with URL list and settings button
  - `_pingUrl(url)`: Performs HTTP GET request to check URL availability
  - `_pingAllUrls()`: Pings all configured URLs at the set interval
  - `_checkNetworkConnection()`: Validates internet connectivity before pinging
  - `_updateMainStatus()`: Updates panel icon based on worst-case URL status
  - `_sendNotification(url)`: Sends GNOME notification for failed URLs (throttled to once per hour)

#### PingBotPreferences (`prefs.js`)
- **Type**: Preferences UI Class
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

#### icons/
- `robot-green.svg`: 32x32 robot icon for successful status
- `robot-yellow.svg`: 32x32 robot icon for unknown status
- `robot-red.svg`: 32x32 robot icon for failed status
- Note: Panel uses emoji (🤖 + colored circles), settings list uses colored circle emojis

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
- Network connectivity pre-check using Firefox detection portal
- Async HTTP requests using libsoup
- Status persistence across sessions using GSettings

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
- Clean separation between extension logic and preferences UI
- Emoji-based visual indicators (no SVG loading in runtime)
- Proper resource cleanup in disable()
- Event-driven menu updates via GSettings signals

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
