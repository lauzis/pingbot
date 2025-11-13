import St from 'gi://St';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {PingStatus} from './statusManager.js';

export class PanelIndicator {
    constructor(uuid, name, settings, statusManager, onOpenPreferences, logger) {
        this._uuid = uuid;
        this._name = name;
        this._settings = settings;
        this._statusManager = statusManager;
        this._onOpenPreferences = onOpenPreferences;
        this._logger = logger;

        this._createIndicator();
    }

    _createIndicator() {
        this._indicator = new PanelMenu.Button(0.5, this._name, false);

        this._statusLabel = new St.Label({
            text: '🤖🟡',
            y_align: 2,
            style_class: 'system-status-icon'
        });

        this._indicator.add_child(this._statusLabel);
        Main.panel.addToStatusArea(this._uuid, this._indicator);
    }

    updateStatus(status) {
        const emoji = status === PingStatus.GREEN ? '🟢' :
                     status === PingStatus.RED ? '🔴' : '🟡';
        this._statusLabel.set_text('🤖 ' + emoji);
    }

    buildMenu() {
        this._indicator.menu.removeAll();

        const urls = this._settings.get_strv('ping-urls');

        if (urls.length > 0) {
            urls.forEach(url => this._addUrlMenuItem(url));
            this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        }

        this._addSettingsMenuItem();
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
            this._statusLabel = null;
        }
    }
}
