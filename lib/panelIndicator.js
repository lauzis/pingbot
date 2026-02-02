import St from 'gi://St';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {PingStatus} from './statusManager.js';
import {IconHelper, IconType} from './iconHelper.js';

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
        this._iconHelper = new IconHelper(settings);

        this._createIndicator();
        
        this._iconStyleSignalId = this._settings.connect('changed::icon-style', () => {
            this._recreateIndicatorContent();
            this.updateStatus(this._lastStatus);
        });
        
        this._iconSizeSignalId = this._settings.connect('changed::icon-size', () => {
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

        const style = this._iconHelper.getIconStyle();
        const size = this._iconHelper.getIconSize();

        if (style === 'material' || style === 'symbolic') {
            this._content = new St.BoxLayout({
                style_class: 'system-status-icon',
                spacing: 4
            });
            
            this._robotIcon = new St.Icon({
                gicon: this._iconHelper.createPanelIcon(IconType.ROBOT),
                icon_size: size
            });
            this._content.add_child(this._robotIcon);
            
            this._statusIcon = new St.Icon({
                icon_size: size
            });
            this._content.add_child(this._statusIcon);
        } else {
            const robotEmoji = this._iconHelper.createPanelIcon(IconType.ROBOT);
            const statusEmoji = this._iconHelper.createPanelIcon(IconType.STATUS_YELLOW);
            this._content = new St.Label({
                text: robotEmoji + statusEmoji,
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
        const style = this._iconHelper.getIconStyle();
        const size = this._iconHelper.getIconSize();
        
        let iconType;
        if (status === PingStatus.GREEN) {
            iconType = IconType.STATUS_GREEN;
        } else if (status === PingStatus.RED) {
            iconType = IconType.STATUS_RED;
        } else {
            iconType = IconType.STATUS_YELLOW;
        }
        
        if ((style === 'material' || style === 'symbolic') && this._statusIcon) {
            this._statusIcon.set_gicon(this._iconHelper.createPanelIcon(iconType));
            this._statusIcon.set_icon_size(size);
        } else if (this._content) {
            const robotEmoji = this._iconHelper.createPanelIcon(IconType.ROBOT);
            const statusEmoji = this._iconHelper.createPanelIcon(iconType);
            this._content.set_text(robotEmoji + ' ' + statusEmoji);
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
        const size = this._iconHelper.getIconSize();
        const style = this._iconHelper.getIconStyle();
        
        if (style === 'material' || style === 'symbolic') {
            const icon = new St.Icon({
                gicon: this._iconHelper.createPanelIcon(IconType.REFRESH),
                style_class: 'popup-menu-icon',
                icon_size: size
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
        const style = this._iconHelper.getIconStyle();
        const size = this._iconHelper.getIconSize();
        
        let iconType;
        if (status === PingStatus.GREEN) {
            iconType = IconType.STATUS_GREEN;
        } else if (status === PingStatus.RED) {
            iconType = IconType.STATUS_RED;
        } else {
            iconType = IconType.STATUS_YELLOW;
        }
        
        let urlItem;
        if (style === 'material' || style === 'symbolic') {
            urlItem = new PopupMenu.PopupMenuItem(url);
            const icon = new St.Icon({
                gicon: this._iconHelper.createPanelIcon(iconType),
                style_class: 'popup-menu-icon',
                icon_size: size
            });
            urlItem.insert_child_at_index(icon, 0);
        } else {
            const emoji = this._iconHelper.createPanelIcon(iconType);
            urlItem = new PopupMenu.PopupMenuItem(emoji + ' ' + url);
        }
        
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
        const size = this._iconHelper.getIconSize();
        const style = this._iconHelper.getIconStyle();
        
        if (style === 'material' || style === 'symbolic') {
            const icon = new St.Icon({
                gicon: this._iconHelper.createPanelIcon(IconType.SETTINGS),
                style_class: 'popup-menu-icon',
                icon_size: size
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
        if (this._iconStyleSignalId) {
            this._settings.disconnect(this._iconStyleSignalId);
            this._iconStyleSignalId = null;
        }

        if (this._iconSizeSignalId) {
            this._settings.disconnect(this._iconSizeSignalId);
            this._iconSizeSignalId = null;
        }

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
            this._content = null;
        }
    }
}
