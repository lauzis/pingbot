# Ping Bot - GNOME Shell Extension

A lightweight GNOME Shell extension that monitors the availability of your websites and services by periodically pinging URLs and displaying their status with visual indicators.
Monitor your important websites at a glance. Add URLs to your list, see status indicators in the panel:
🟢 - Everything is ok, all sites reachable.
🟡 - Unknow or no network.
🔴 - Some site is not reachable.

## Icon Styles

Choose your preferred icon style:

**Freeicons (Default)**

![Freeicons Style](git-images/ping-bot-freeicons.png)

**Material Design**

![Material Icons Style](git-images/ping-bot-material-icons.png)

**Emoji**

![Emoji Style](git-images/ping-bot.png)


## Why Ping Bot?

**Simple Local Monitoring** - Pings run directly from your machine, no external infrastructure needed:
No external services, no API keys, or accounts needed.
Similar to uptime robot services, but from your local machine.

**Comparison to Other Solutions:**
- no api keys
- no accounts
- request from local machine
- no history just status

## Features

- **Visual Status Indicators**: Color-coded emoji indicators (green/yellow/red) show the health of your monitored URLs
- **Panel Menu**: Click the panel icon to see all monitored URLs with their current status
- **Automatic Monitoring**: Configurable ping intervals
- **Network Awareness**: Automatically detects network connectivity before attempting to ping URLs
- **Per-URL Status**: Each URL displays its own status icon in the settings panel and dropdown menu
- **Real-time Updates**: Status icons update live in the preferences window and panel menu
- **Failure Notifications**: Receive GNOME notifications when URLs fail (maximum once per hour)
- **Click to Open**: Click URLs in the panel dropdown to open them in your default browser

## Installation

### Enable it trough GNOME Extensions website
https://extensions.gnome.org/extension/8777/ping-bot/

or

### Manual/local install - Quick Start (3 steps)

1. **Install the extension:**
   ```bash
   git clone https://github.com/lauzis/pingbot.git ~/.local/share/gnome-shell/extensions/pingbot@gudlenieks.lv
   ```

2. **Compile the settings schema:**
   ```bash
   cd ~/.local/share/gnome-shell/extensions/pingbot@gudlenieks.lv/schemas
   glib-compile-schemas .
   ```

3. **Enable the extension:**
   - Press `Alt+F2`, type `r`, press Enter (X11) OR log out and back in (Wayland)
   - Enable: `gnome-extensions enable pingbot@gudlenieks.lv`

### Getting Started

1. **Add URLs**: Click robot icon → Settings → Enter URLs to monitor
2. **Configure**: Set ping interval
3. **Monitor**: Status updates automatically - click URLs in panel to open them

## Usage

### Adding URLs to Monitor

1. Click on the robot icon in the top panel
2. Select Settings from the dropdown menu
3. In the "URLs to Monitor" section:
   - Enter a URL (e.g., `https://example.com`)
   - Click Add URL or press Enter
4. The URL will appear in the list with a status icon

### Status Indicators

The extension uses three colored circles to indicate status:

- 🟢 Green circle: URL is accessible (HTTP 200 OK)
- 🟡 Yellow circle: Status unknown or no network connection
- 🔴 Red circle: URL is not accessible or returned an error

### Panel Icon Logic

The main panel icon shows a robot emoji followed by a colored status circle:

- All URLs green: Panel shows robot + green circle
- All URLs yellow: Panel shows robot + yellow circle
- Any URL red: Panel shows robot + red circle (even if others are green)

### Panel Dropdown Menu

Click the panel icon to see:
- List of all monitored URLs with their current status
- Click any URL to open it in your default browser
- Settings button to access configuration

### Configuring Ping Interval

1. Open Settings (click robot icon → Settings)
2. Adjust the "Ping Interval" value (1-1440 minutes)
3. The extension will automatically use the new interval

### Deleting URLs

Click the trash icon next to any URL in the settings list to remove it from monitoring.

## How It Works

1. **Network Check**: Before pinging URLs, the extension checks for internet connectivity
2. **Periodic Pinging**: At the configured interval, the extension sends HTTP GET requests to each URL
3. **Status Update**: Based on the response (or lack thereof), each URL's status is updated
4. **Visual Feedback**: Icons in both the panel and settings window update to reflect current status
5. **Failure Notifications**: When a URL transitions from working to failed, a GNOME notification is sent (throttled to once per hour)
6. **Persistence**: All statuses are saved to GSettings and survive extension reloads

## Technical Details

### Architecture

- **Extension Type**: GNOME Shell Panel Extension
- **Language**: JavaScript (GJS)
- **Code Organization**: Modular architecture with `lib/` directory (7 focused modules)
- **Dependencies**: 
  - GNOME Shell
  - GTK4 (Adwaita)
  - libsoup (for HTTP requests)
  - GSettings (for configuration storage)
  - Gio.NetworkMonitor (for network connectivity checks)
  - 
### Settings Schema

The extension uses GSettings to store:

- `ping-interval` (integer): Time between pings in minutes
- `ping-urls` (array of strings): List of URLs to monitor
- `url-statuses` (JSON string): Cached status for each URL
- `request-timeout` (integer): Maximum time to wait for HTTP response in seconds
- `icon-style` (string): Style of the panel icon (freeicons, material, or emoji)
- `icon-size` (integer): Size of the panel icon in pixels

## Development

### Viewing Logs

Production logs:
```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep "\[pingbot\]"
```

Debug mode (verbose):
```bash
G_MESSAGES_DEBUG=pingbot gnome-shell --replace
journalctl -f -o cat /usr/bin/gnome-shell | grep "\[pingbot\]"
```

### Debugging

Enable the extension and check for errors:

```bash
gnome-extensions info pingbot@gudlenieks.lv
```

## Known Limitations

- URLs must be accessible via HTTP/HTTPS GET requests
- Only HTTP and HTTPS protocols are supported (FTP, file://, etc. are rejected)
- Minimum ping interval is 1 minute (to avoid excessive network traffic)
- Network check uses GNOME's native NetworkMonitor API
- Notifications are throttled to once per hour to avoid spam

## Recent Updates

**Version 1.0.5** (February 2, 2026) - Added icon styles (Freeicons, Material, Emoji) and configurable icon size.

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## Compatibility

- **GNOME Shell**: 45, 46, 47, 48, 49
- **Tested on**: Ubuntu 24.04, Ubuntu 24.10, Ubuntu 25.04, Ubuntu 25.10, Fedora 40

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions, bug reports, and feature requests are welcome!

## Author

Aivars Lauzis

Code mostly generated by GitHub Copilot CLI.

## Acknowledgements

- Code reviews by [CodeRabbit](https://coderabbit.ai/)

## Support Development

If you find this extension useful, consider supporting development:

Donate via PayPal: https://www.paypal.com/donate?token=mBDA_icmxwBEaawsjEBTbO0DqE74jH7k_ZX4_Bgtju4TKj35HO_aqQ0tFD8Wyh-TZ-xGHEk8dBrRAuJ7
Donate via PayPal: https://www.paypal.com/paypalme/Lauzis
Donate via GitHub: https://github.com/sponsors/lauzis

---

**Version**: 5
**Last Updated**: February 8, 2026
