import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import {IconHelper, IconType} from './lib/iconHelper.js';

export default class PingBotPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
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
            subtitle: 'Size in pixels (default: 16)',
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
        
        settings.connect('changed::icon-style', rebuildPreviewRows);
        
        const previewRow = new Adw.ActionRow();
        previewRow.set_child(previewBox);
        appearanceGroup.add(previewRow);
        
        page.add(appearanceGroup);
        
        // URLs group
        const urlsGroup = new Adw.PreferencesGroup({
            title: 'URLs to Monitor',
            description: 'Add URLs that the bot will ping',
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
            
            let iconType;
            if (status === 'green') {
                iconType = IconType.STATUS_GREEN;
            } else if (status === 'red') {
                iconType = IconType.STATUS_RED;
            } else {
                iconType = IconType.STATUS_YELLOW;
            }
            
            const statusWidget = iconHelper.createPrefsIcon(iconType, Gtk);
            row._statusWidget = statusWidget;
            row._url = url;
            
            const label = new Gtk.Label({
                label: url,
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
                    
                    let iconType;
                    if (status === 'green') {
                        iconType = IconType.STATUS_GREEN;
                    } else if (status === 'red') {
                        iconType = IconType.STATUS_RED;
                    } else {
                        iconType = IconType.STATUS_YELLOW;
                    }
                    
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
        
        // Add URL row with entry and button
        const addUrlBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_start: 6,
            margin_end: 6,
            margin_top: 6,
        });
        
        const urlEntry = new Gtk.Entry({
            placeholder_text: 'https://example.com',
            hexpand: true,
        });
        
        // Clear error styling when user types
        urlEntry.connect('changed', () => {
            urlEntry.remove_css_class('error');
        });
        
        const addButton = new Gtk.Button({
            label: 'Add URL',
            valign: Gtk.Align.CENTER,
        });
        
        addButton.connect('clicked', () => {
            const url = urlEntry.get_text().trim();
            if (url) {
                // Validate URL format
                try {
                    const urlObj = GLib.Uri.parse(url, GLib.UriFlags.NONE);
                    const scheme = urlObj.get_scheme();
                    
                    // Only allow http and https
                    if (scheme !== 'http' && scheme !== 'https') {
                        urlEntry.add_css_class('error');
                        return;
                    }
                    
                    // URL is valid, remove error styling
                    urlEntry.remove_css_class('error');
                    
                    const urls = settings.get_strv('ping-urls');
                    if (!urls.includes(url)) {
                        urls.push(url);
                        settings.set_strv('ping-urls', urls);
                        urlEntry.set_text('');
                    }
                } catch (e) {
                    // Invalid URL format
                    urlEntry.add_css_class('error');
                    console.error('Invalid URL:', e.message);
                }
            }
        });
        
        urlEntry.connect('activate', () => {
            addButton.emit('clicked');
        });
        
        addUrlBox.append(urlEntry);
        addUrlBox.append(addButton);
        
        const addUrlRow = new Adw.ActionRow();
        addUrlRow.set_child(addUrlBox);
        urlsGroup.add(addUrlRow);
        
        const urlListRow = new Adw.ActionRow();
        urlListRow.set_child(urlsBox);
        urlsGroup.add(urlListRow);
        
        // Watch for URL list changes and refresh
        settings.connect('changed::ping-urls', () => {
            refreshUrlList();
        });
        
        // Watch for status changes and update icons
        settings.connect('changed::url-statuses', () => {
            updateAllIcons();
        });
        
        // Watch for icon style changes and rebuild list
        settings.connect('changed::icon-style', () => {
            refreshUrlList();
        });
        
        refreshUrlList();
        
        page.add(urlsGroup);
        window.add(page);
    }
}
