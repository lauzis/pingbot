import St from 'gi://St';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {PingStatus} from './statusManager.js';

export class PanelIndicator {
    constructor(uuid, name, settings, statusManager, onOpenPreferences, onForceRecheck, logger, extensionDir) {
        this._uuid = uuid;
        this._name = name;
        this._settings = settings;
        this._statusManager = statusManager;
        this._onOpenPreferences = onOpenPreferences;
        this._onForceRecheck = onForceRecheck;
        this._logger = logger;
        this._extensionDir = extensionDir;
        this._lastStatus = PingStatus.YELLOW;

        this._createIndicator();
        
        this._settings.connect('changed::icon-style', () => {
            this._recreateIndicatorContent();
            this.updateStatus(this._lastStatus);
        });
        
        this._settings.connect('changed::icon-size', () => {
            this._recreateIndicatorContent();
            this.updateStatus(this._lastStatus);
        });
    }

    _createIndicator() {
        this._indicator = new PanelMenu.Button(0.5, this._name, false);
        Main.panel.addToStatusArea(this._uuid, this._indicator);
        this._recreateIndicatorContent();
    }

    _recreateIndicatorContent() {
        if (this._content) {
            this._content.destroy();
        }

        const style = this._settings.get_string('icon-style');
        const size = this._settings.get_int('icon-size');

        if (style === 'material') {
            this._content = new St.Icon({
                style_class: 'system-status-icon',
                icon_size: size
            });
        } else {
            this._content = new St.Label({
                text: '🤖🟡',
                y_align: 2,
                style_class: 'system-status-icon',
                style: `font-size: ${size}px;`
            });
        }

        this._indicator.add_child(this._content);
    }

    _getIconPath(filename) {
        if (!this._extensionDir) return null;
        return this._extensionDir.get_child('icons').get_child(filename);
    }

    updateStatus(status) {
        this._lastStatus = status;
        const style = this._settings.get_string('icon-style');
        
        if (style === 'material') {
            let iconName;
            if (status === PingStatus.GREEN) {
                iconName = 'check_circle_24dp_E3E3E3_FILL0_wght100_GRAD0_opsz24.svg';
            } else if (status === PingStatus.RED) {
                iconName = 'error_24dp_E3E3E3_FILL0_wght100_GRAD0_opsz24.svg';
            } else {
                iconName = 'help_24dp_E3E3E3_FILL0_wght100_GRAD0_opsz24.svg';
            }
            
            const iconFile = this._getIconPath(iconName);
            if (iconFile) {
                const gicon = new Gio.FileIcon({ file: iconFile });
                this._content.set_gicon(gicon);
            }
            
            // Set color based on status
            if (status === PingStatus.RED) {
                this._content.set_style('color: #e74c3c;');
            } else if (status === PingStatus.YELLOW) {
                this._content.set_style('color: #f1c40f;');
            } else {
                this._content.set_style(''); // Theme default
            } 
        } else {
            const emoji = status === PingStatus.GREEN ? '🟢' :
                         status === PingStatus.RED ? '🔴' : '🟡';
            this._content.set_text('🤖 ' + emoji);
        }
    }

    buildMenu() {
        this._indicator.menu.removeAll();

        const urls = this._settings.get_strv('ping-urls');

        if (urls.length > 0) {
            urls.forEach(url => this._addUrlMenuItem(url));
            this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this._addForceRecheckMenuItem();
        this._addSettingsMenuItem();
    }

    _addForceRecheckMenuItem() {
        const recheckItem = new PopupMenu.PopupMenuItem('Force Recheck');
        
        const iconPath = this._getIconPath('refresh_24dp_E3E3E3_FILL0_wght100_GRAD0_opsz24.svg');
        if (iconPath) {
            const icon = new St.Icon({
                gicon: new Gio.FileIcon({ file: iconPath }),
                style_class: 'popup-menu-icon'
            });
            recheckItem.insert_child_at_index(icon, 0);
        }

        recheckItem.connect('activate', () => {
            if (this._onForceRecheck) {
                this._onForceRecheck();
            }
        });
        this._indicator.menu.addMenuItem(recheckItem);
    }

    _addUrlMenuItem(url) {
        const status = this._statusManager.getStatus(url);
        const emoji = status === PingStatus.GREEN ? '🟢' :
                     status === PingStatus.RED ? '🔴' : '🟡';

        const urlItem = new PopupMenu.PopupMenuItem(emoji + ' ' + url);
        urlItem.connect('activate', () => {
            try {
                Gio.AppInfo.launch_default_for_uri(url, null);
                this._logger.debug('Opened URL in browser', { url });
            } catch (e) {
                this._logger.error('Failed to open URL', e);
            }
        });
        this._indicator.menu.addMenuItem(urlItem);
    }

    _addSettingsMenuItem() {
        const settingsItem = new PopupMenu.PopupMenuItem('Settings');
        
        const iconPath = this._getIconPath('settings_24dp_E3E3E3_FILL0_wght100_GRAD0_opsz24.svg');
        if (iconPath) {
            const icon = new St.Icon({
                gicon: new Gio.FileIcon({ file: iconPath }),
                style_class: 'popup-menu-icon'
            });
            settingsItem.insert_child_at_index(icon, 0);
        }

        settingsItem.connect('activate', () => {
            if (this._onOpenPreferences) {
                this._onOpenPreferences();
            }
        });
        this._indicator.menu.addMenuItem(settingsItem);
    }

    destroy() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
            this._content = null;
        }
    }
}
