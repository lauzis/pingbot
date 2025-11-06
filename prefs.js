import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class PingBotPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        
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
            
            // Use emoji instead of SVG
            let emoji = '🟡'; // yellow
            if (status === 'green') {
                emoji = '🟢';
            } else if (status === 'red') {
                emoji = '🔴';
            }
            
            const statusLabel = new Gtk.Label({
                label: emoji,
                xalign: 0,
            });
            
            // Store status label reference for updates
            row._statusLabel = statusLabel;
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
            
            row.append(statusLabel);
            row.append(label);
            row.append(deleteButton);
            
            return row;
        };
        
        // Function to update icon status for all rows
        const updateAllIcons = () => {
            const statuses = getUrlStatuses();
            let child = urlsBox.get_first_child();
            while (child) {
                if (child._statusLabel && child._url) {
                    const status = statuses[child._url] || 'yellow';
                    let emoji = '🟡';
                    if (status === 'green') {
                        emoji = '🟢';
                    } else if (status === 'red') {
                        emoji = '🔴';
                    }
                    child._statusLabel.set_label(emoji);
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
        
        refreshUrlList();
        
        page.add(urlsGroup);
        window.add(page);
    }
}
