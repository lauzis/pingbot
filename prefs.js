import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {IconHelper, IconType} from './lib/iconHelper.js';
import {Logger, LOG_DOMAIN} from './lib/logger.js';
import {PING_PREFIX, displayTarget} from './lib/targetUtils.js';

export default class PingBotPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const logger = new Logger(LOG_DOMAIN);
        const settings = this.getSettings();
        const settingsSignals = [];
        const iconHelper = new IconHelper(settings, this.dir);
        
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Ping Bot Preferences',
        });
        
        const intervalRow = new Adw.SpinRow({
            title: 'Ping Interval',
            subtitle: 'Time between pings in minutes',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 1440,
                step_increment: 1,
                page_increment: 10,
            }),
        });
        
        settings.bind(
            'ping-interval',
            intervalRow,
            'value',
            0
        );
        
        group.add(intervalRow);
        
        const timeoutRow = new Adw.SpinRow({
            title: 'Request Timeout',
            subtitle: 'Maximum time to wait for HTTP response in seconds',
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 30,
                step_increment: 1,
                page_increment: 5,
            }),
        });
        
        settings.bind(
            'request-timeout',
            timeoutRow,
            'value',
            0
        );
        
        group.add(timeoutRow);
        page.add(group);

        // Appearance group
        const appearanceGroup = new Adw.PreferencesGroup({
            title: 'Appearance',
        });

        // Icon Style
        const styleRow = new Adw.ComboRow({
            title: 'Icon Style',
            subtitle: 'Choose icon appearance for panel',
            model: new Gtk.StringList({
                strings: ['Freeicons', 'Material Icons', 'Emoji']
            }),
        });

        const styles = ['freeicons', 'material', 'emoji'];
        const currentStyle = settings.get_string('icon-style');
        styleRow.selected = Math.max(0, styles.indexOf(currentStyle));

        styleRow.connect('notify::selected', () => {
            settings.set_string('icon-style', styles[styleRow.selected]);
        });

        appearanceGroup.add(styleRow);

        // Icon Size
        const sizeRow = new Adw.SpinRow({
            title: 'Icon Size',
            subtitle: 'Size in pixels (default: 22)',
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 64,
                step_increment: 2,
                page_increment: 4,
            }),
        });

        settings.bind(
            'icon-size',
            sizeRow,
            'value',
            0
        );

        appearanceGroup.add(sizeRow);
        
        // Icon Preview Table
        const previewBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 8,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
        });
        
        const previewLabel = new Gtk.Label({
            label: 'Icon Preview',
            xalign: 0,
            margin_bottom: 6,
        });
        previewLabel.add_css_class('heading');
        previewBox.append(previewLabel);
        
        const createPreviewRow = (label, iconType) => {
            const row = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 12,
                margin_start: 12,
            });
            
            const iconWidget = iconHelper.createPrefsIcon(iconType, Gtk);
            row._iconWidget = iconWidget;
            row._iconType = iconType;
            
            const labelWidget = new Gtk.Label({
                label: label,
                xalign: 0,
                hexpand: true,
            });
            
            row.append(iconWidget);
            row.append(labelWidget);
            
            return row;
        };
        
        const previewData = [
            { label: 'Status: Online', type: IconType.STATUS_GREEN },
            { label: 'Status: Unknown', type: IconType.STATUS_YELLOW },
            { label: 'Status: Offline', type: IconType.STATUS_RED },
            { label: 'Robot/Server Icon', type: IconType.ROBOT },
            { label: 'Refresh Icon', type: IconType.REFRESH },
            { label: 'Settings Icon', type: IconType.SETTINGS },
        ];
        
        const rebuildPreviewRows = () => {
            // Remove all existing rows
            let child = previewBox.get_first_child();
            while (child) {
                if (child !== previewLabel) {
                    const next = child.get_next_sibling();
                    previewBox.remove(child);
                    child = next;
                } else {
                    child = child.get_next_sibling();
                }
            }
            
            // Add new rows with current style
            previewData.forEach(({ label, type }) => {
                previewBox.append(createPreviewRow(label, type));
            });
        };
        
        rebuildPreviewRows();
        
        settingsSignals.push(settings.connect('changed::icon-style', rebuildPreviewRows));
        
        const previewRow = new Adw.ActionRow();
        previewRow.set_child(previewBox);
        appearanceGroup.add(previewRow);
        
        page.add(appearanceGroup);
        
        // Targets group
        const urlsGroup = new Adw.PreferencesGroup({
            title: 'Targets to Monitor',
            description: 'Add URLs or IP addresses to monitor',
        });
        
        // Container for URL list
        const urlsBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
            margin_top: 6,
            margin_bottom: 6,
        });
        
        // Get current statuses
        const getUrlStatuses = () => {
            try {
                const statusJson = settings.get_string('url-statuses');
                return JSON.parse(statusJson);
            } catch (e) {
                return {};
            }
        };
        
        // Function to create URL row with status icon
        const createUrlRow = (url) => {
            const row = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 6,
                margin_start: 6,
                margin_end: 6,
            });

            const statuses = getUrlStatuses();
            const status = statuses[url] || 'yellow';
            const iconType = iconHelper.getIconTypeFromStatus(status);

            const statusWidget = iconHelper.createPrefsIcon(iconType, Gtk);
            row._statusWidget = statusWidget;
            row._url = url;

            const label = new Gtk.Label({
                label: displayTarget(url),
                xalign: 0,
                hexpand: true,
            });

            const deleteButton = new Gtk.Button({
                icon_name: 'user-trash-symbolic',
                valign: Gtk.Align.CENTER,
            });

            deleteButton.connect('clicked', () => {
                const urls = settings.get_strv('ping-urls');
                const index = urls.indexOf(url);
                if (index > -1) {
                    urls.splice(index, 1);
                    settings.set_strv('ping-urls', urls);
                }
            });

            row.append(statusWidget);
            row.append(label);
            row.append(deleteButton);

            return row;
        };
        
        const updateAllIcons = () => {
            const statuses = getUrlStatuses();
            let child = urlsBox.get_first_child();
            while (child) {
                if (child._statusWidget && child._url) {
                    const status = statuses[child._url] || 'yellow';
                    const iconType = iconHelper.getIconTypeFromStatus(status);
                    
                    iconHelper.updatePrefsIcon(child._statusWidget, iconType);
                }
                child = child.get_next_sibling();
            }
        };
        
        // Function to refresh URL list
        const refreshUrlList = () => {
            let child = urlsBox.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                urlsBox.remove(child);
                child = next;
            }
            
            const urls = settings.get_strv('ping-urls');
            urls.forEach(url => {
                urlsBox.append(createUrlRow(url));
            });
        };
        
        // Add target row with type selector, entry and button
        const addUrlBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_start: 6,
            margin_end: 6,
            margin_top: 6,
        });

        const typeCombo = new Gtk.ComboBoxText({ valign: Gtk.Align.CENTER });
        typeCombo.append('http', 'HTTP');
        typeCombo.append('ping', 'Ping');
        typeCombo.set_active(0);

        const urlEntry = new Gtk.Entry({
            placeholder_text: 'https://example.com',
            hexpand: true,
        });

        typeCombo.connect('changed', () => {
            const isPing = typeCombo.get_active_id() === 'ping';
            urlEntry.set_placeholder_text(isPing ? 'Domain, IPv4 or IPv6' : 'https://example.com');
            urlEntry.remove_css_class('error');
        });

        urlEntry.connect('changed', () => {
            urlEntry.remove_css_class('error');
        });

        const addButton = new Gtk.Button({
            label: 'Add',
            valign: Gtk.Align.CENTER,
        });

        addButton.connect('clicked', () => {
            const input = urlEntry.get_text().trim();
            if (!input) return;

            const monitorType = typeCombo.get_active_id();
            let target;

            if (monitorType === 'http') {
                try {
                    const urlObj = GLib.Uri.parse(input, GLib.UriFlags.NONE);
                    const scheme = urlObj.get_scheme();
                    if (scheme !== 'http' && scheme !== 'https') {
                        urlEntry.add_css_class('error');
                        return;
                    }
                    urlEntry.remove_css_class('error');
                    target = input;
                } catch (e) {
                    urlEntry.add_css_class('error');
                    logger.error('Invalid URL', e);
                    return;
                }
            } else {
                // Basic sanity check: non-empty, no whitespace
                if (/\s/.test(input) || input.includes('://') || input.includes('/')) {
                    urlEntry.add_css_class('error');
                    return;
                }
                urlEntry.remove_css_class('error');
                target = `${PING_PREFIX}${input}`;
            }

            const urls = settings.get_strv('ping-urls');
            if (!urls.includes(target)) {
                urls.push(target);
                settings.set_strv('ping-urls', urls);
                urlEntry.set_text('');
            }
        });

        urlEntry.connect('activate', () => {
            addButton.emit('clicked');
        });

        addUrlBox.append(typeCombo);
        addUrlBox.append(urlEntry);
        addUrlBox.append(addButton);
        
        const addUrlRow = new Adw.ActionRow();
        addUrlRow.set_child(addUrlBox);
        urlsGroup.add(addUrlRow);
        
        const urlListRow = new Adw.ActionRow();
        urlListRow.set_child(urlsBox);
        urlsGroup.add(urlListRow);
        
        // Watch for URL list changes and refresh
        settingsSignals.push(settings.connect('changed::ping-urls', () => {
            refreshUrlList();
        }));
        
        // Watch for status changes and update icons
        settingsSignals.push(settings.connect('changed::url-statuses', () => {
            updateAllIcons();
        }));
        
        // Watch for icon style changes and rebuild list
        settingsSignals.push(settings.connect('changed::icon-style', () => {
            refreshUrlList();
        }));
        
        refreshUrlList();
        
        page.add(urlsGroup);
        window.add(page);

        window.connect('close-request', () => {
            settingsSignals.forEach(id => {
                settings.disconnect(id);
            });
        });
    }
}
