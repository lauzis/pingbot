import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

const PingStatus = {
    GREEN: 'green',
    YELLOW: 'yellow',
    RED: 'red'
};

export default class PingBotExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._urlStatuses = {};
        this._lastNotificationTime = 0;
        
        this._indicator = new PanelMenu.Button(0.5, this.metadata.name, false); // 0.5 centers the menu
        
        // Use label for emoji instead of icon
        this._statusLabel = new St.Label({
            text: '🤖🟡',
            y_align: 2, // CENTER
            style_class: 'system-status-icon'
        });
        
        this._indicator.add_child(this._statusLabel);
        
        Main.panel.addToStatusArea(this.metadata.uuid, this._indicator);
        
        // Load cached statuses first
        this._loadStatuses();
        
        // Update main status and build menu after loading statuses
        this._updateMainStatus();
        this._buildMenu();
        
        // Start periodic pinging
        this._startPinging();
        
        // Watch for URL list changes
        this._settings.connect('changed::ping-urls', () => {
            this._buildMenu();
        });
        
        // Watch for status changes
        this._settings.connect('changed::url-statuses', () => {
            this._updateMainStatus();
            this._buildMenu();
        });
        
        console.log('Ping Bot enabled!');
    }

    disable() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
        
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
            this._statusLabel = null;
        }
        
        this._settings = null;
        console.log('Ping Bot disabled!');
    }
    
    _loadStatuses() {
        try {
            const statusJson = this._settings.get_string('url-statuses');
            this._urlStatuses = JSON.parse(statusJson);
        } catch (e) {
            this._urlStatuses = {};
        }
    }
    
    _saveStatuses() {
        const statusJson = JSON.stringify(this._urlStatuses);
        this._settings.set_string('url-statuses', statusJson);
    }
    
    _getStatusForUrl(url) {
        return this._urlStatuses[url] || PingStatus.YELLOW;
    }
    
    _setStatusForUrl(url, status) {
        const oldStatus = this._urlStatuses[url];
        this._urlStatuses[url] = status;
        this._saveStatuses();
        this._updateMainStatus();
        
        // Send notification if URL failed and we haven't notified recently
        if (status === PingStatus.RED && oldStatus !== PingStatus.RED) {
            this._checkAndNotifyFailure(url);
        }
    }
    
    _checkAndNotifyFailure(url) {
        const currentTime = GLib.get_real_time() / 1000000; // Convert to seconds
        const oneHour = 60 * 60; // 3600 seconds
        
        if (currentTime - this._lastNotificationTime >= oneHour) {
            this._sendNotification(url);
            this._lastNotificationTime = currentTime;
        }
    }
    
    _sendNotification(url) {
        const source = new MessageTray.Source({
            title: '🤖 Ping Bot',
            iconName: 'dialog-warning-symbolic'
        });
        
        Main.messageTray.add(source);
        
        const notification = new MessageTray.Notification({
            source: source,
            title: '🤖 URL Monitoring Alert',
            body: `${url} is not accessible`,
            isTransient: false
        });
        
        source.addNotification(notification);
        console.log(`Ping Bot: Notification sent for failed URL: ${url}`);
    }
    
    _updateMainStatus() {
        const urls = this._settings.get_strv('ping-urls');
        
        if (urls.length === 0) {
            this._setStatus(PingStatus.YELLOW);
            return;
        }
        
        let hasRed = false;
        let hasYellow = false;
        
        for (const url of urls) {
            const status = this._getStatusForUrl(url);
            if (status === PingStatus.RED) {
                hasRed = true;
                break;
            } else if (status === PingStatus.YELLOW) {
                hasYellow = true;
            }
        }
        
        if (hasRed) {
            this._setStatus(PingStatus.RED);
        } else if (hasYellow) {
            this._setStatus(PingStatus.YELLOW);
        } else {
            this._setStatus(PingStatus.GREEN);
        }
    }
    
    _setStatus(status) {
        let emoji = '🟡'; // yellow
        if (status === PingStatus.GREEN) {
            emoji = '🟢';
        } else if (status === PingStatus.RED) {
            emoji = '🔴';
        }
        this._statusLabel.set_text('🤖 ' + emoji); // Added space between robot and status
    }
    
    _startPinging() {
        const intervalMinutes = this._settings.get_int('ping-interval');
        const intervalMs = intervalMinutes * 60 * 1000;
        
        // Do initial ping
        this._pingAllUrls();
        
        // Set up periodic pinging
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, intervalMs, () => {
            this._pingAllUrls();
            return GLib.SOURCE_CONTINUE;
        });
    }
    
    _checkNetworkConnection(callback) {
        try {
            const timeoutSeconds = this._settings.get_int('request-timeout');
            const session = new Soup.Session({
                timeout: timeoutSeconds
            });
            const message = Soup.Message.new('HEAD', 'http://detectportal.firefox.com/success.txt');
            
            session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (sess, result) => {
                    try {
                        sess.send_and_read_finish(result);
                        const statusCode = message.get_status();
                        callback(statusCode === 200);
                    } catch (e) {
                        console.log('Ping Bot: No network connection detected');
                        callback(false);
                    }
                }
            );
        } catch (e) {
            console.error('Ping Bot: Network check failed:', e.message);
            callback(false);
        }
    }
    
    _setAllUrlsYellow() {
        const urls = this._settings.get_strv('ping-urls');
        urls.forEach(url => {
            this._setStatusForUrl(url, PingStatus.YELLOW);
        });
    }
    
    _pingAllUrls() {
        this._checkNetworkConnection((hasNetwork) => {
            if (!hasNetwork) {
                console.log('Ping Bot: No network connection, setting all URLs to yellow');
                this._setAllUrlsYellow();
                return;
            }
            
            const urls = this._settings.get_strv('ping-urls');
            urls.forEach(url => {
                this._pingUrl(url);
            });
        });
    }
    
    _pingUrl(url) {
        try {
            const timeoutSeconds = this._settings.get_int('request-timeout');
            const session = new Soup.Session({
                timeout: timeoutSeconds
            });
            const message = Soup.Message.new('GET', url);
            
            session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                null,
                (sess, result) => {
                    try {
                        sess.send_and_read_finish(result);
                        const statusCode = message.get_status();
                        
                        if (statusCode === 200) {
                            this._setStatusForUrl(url, PingStatus.GREEN);
                            console.log(`Ping Bot: ${url} - OK (${statusCode})`);
                        } else {
                            this._setStatusForUrl(url, PingStatus.RED);
                            console.log(`Ping Bot: ${url} - ERROR (${statusCode})`);
                        }
                    } catch (e) {
                        this._setStatusForUrl(url, PingStatus.RED);
                        console.error(`Ping Bot: ${url} - FAILED:`, e.message);
                    }
                }
            );
        } catch (e) {
            this._setStatusForUrl(url, PingStatus.RED);
            console.error(`Ping Bot: Failed to ping ${url}:`, e.message);
        }
    }
    
    _openSettings() {
        try {
            this.openPreferences();
        } catch (e) {
            console.error('Failed to open settings:', e);
        }
    }
    
    _buildMenu() {
        // Clear existing menu items
        this._indicator.menu.removeAll();
        
        // Add URL list with status indicators
        const urls = this._settings.get_strv('ping-urls');
        
        if (urls.length > 0) {
            urls.forEach(url => {
                const status = this._getStatusForUrl(url);
                let emoji = '🟡';
                if (status === PingStatus.GREEN) {
                    emoji = '🟢';
                } else if (status === PingStatus.RED) {
                    emoji = '🔴';
                }
                
                const urlItem = new PopupMenu.PopupMenuItem(emoji + ' ' + url);
                urlItem.connect('activate', () => {
                    // Open URL in default browser
                    try {
                        Gio.AppInfo.launch_default_for_uri(url, null);
                    } catch (e) {
                        console.error('Failed to open URL:', e);
                    }
                });
                this._indicator.menu.addMenuItem(urlItem);
            });
            
            // Add separator
            this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }
        
        // Add Settings button
        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        settingsItem.connect('activate', () => {
            this._openSettings();
        });
        this._indicator.menu.addMenuItem(settingsItem);
    }
}
