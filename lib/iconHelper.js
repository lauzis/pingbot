import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export const IconType = {
    STATUS_GREEN: 'status-green',
    STATUS_YELLOW: 'status-yellow',
    STATUS_RED: 'status-red',
    ROBOT: 'robot',
    REFRESH: 'refresh',
    SETTINGS: 'settings',
};

const EMOJI_MAP = {
    'status-green': '🟢',
    'status-yellow': '🟡',
    'status-red': '🔴',
    'robot': '🤖',
    'refresh': '🔄',
    'settings': '⚙️',
};

// Icon filenames (single source of truth for both freeicons and material)
const ICON_FILENAMES = {
    'status-green': 'status-green-symbolic.svg',
    'status-yellow': 'status-yellow-symbolic.svg',
    'status-red': 'status-red-symbolic.svg',
    'robot': 'robot-symbolic.svg',
    'refresh': 'refresh-symbolic.svg',
    'settings': 'settings-symbolic.svg',
};

const GTK_CSS_CLASS_MAP = {
    'status-green': 'success',
    'status-yellow': 'warning',
    'status-red': 'error',
};

export class IconHelper {
    constructor(settings, extensionDir, logger = null) {
        this._settings = settings;
        this._extensionDir = extensionDir;
        this._logger = logger;
    }
    
    /**
     * Get icon style from settings
     * @returns {string} 'freeicons', 'material', or 'emoji'
     */
    getIconStyle() {
        const style = this._settings.get_string('icon-style');
        return style === 'symbolic' ? 'freeicons' : style;
    }
    
    /**
     * Get icon size from settings
     * @returns {number}
     */
    getIconSize() {
        return this._settings.get_int('icon-size');
    }
    
    /**
     * Create icon for St.Icon (panel/menu) based on current style setting
     * @param {string} iconType - One of IconType constants
     * @returns {Gio.Icon|string} Icon for freeicons/material, string for emoji
     */
    createPanelIcon(iconType) {
        const style = this.getIconStyle();
        
        if (style === 'freeicons') {
            return this._createFileIcon(iconType, 'freeicons');
        } else if (style === 'material') {
            return this._createFileIcon(iconType, 'material');
        } else {
            return EMOJI_MAP[iconType] || '❓';
        }
    }
    
    /**
     * Check if current style uses emoji (for menu item formatting)
     * @returns {boolean} true if emoji style
     */
    isEmojiStyle() {
        return this.getIconStyle() === 'emoji';
    }
    
    /**
     * Create menu item with icon based on current style
     * @param {string} text - Menu item text
     * @param {string} iconType - One of IconType constants
     * @param {any} PopupMenu - PopupMenu module reference
     * @param {any} St - St module reference
     * @returns {PopupMenu.PopupMenuItem}
     */
    createMenuItem(text, iconType, PopupMenu, St) {
        const style = this.getIconStyle();
        const size = this.getIconSize();
        
        if (style === 'emoji') {
            const emoji = this.createPanelIcon(iconType);
            return new PopupMenu.PopupMenuItem(emoji + ' ' + text);
        } else {
            const item = new PopupMenu.PopupMenuItem(text);
            const icon = new St.Icon({
                gicon: this.createPanelIcon(iconType),
                style_class: 'popup-menu-icon',
                icon_size: size
            });
            
            // Add color CSS class for status icons
            if (iconType === IconType.STATUS_GREEN) {
                icon.add_style_class_name('pingbot-status-green');
            } else if (iconType === IconType.STATUS_YELLOW) {
                icon.add_style_class_name('pingbot-status-yellow');
            } else if (iconType === IconType.STATUS_RED) {
                icon.add_style_class_name('pingbot-status-red');
            }
            
            item.insert_child_at_index(icon, 0);
            return item;
        }
    }
    
    /**
     * Map PingStatus string to IconType constant
     * @param {string} status - 'green', 'yellow', or 'red'
     * @returns {string} IconType constant
     */
    getIconTypeFromStatus(status) {
        if (status === 'green') {
            return IconType.STATUS_GREEN;
        } else if (status === 'red') {
            return IconType.STATUS_RED;
        }
        return IconType.STATUS_YELLOW;
    }
    
    /**
     * Create status widget for GTK preferences based on current style setting
     * @param {string} iconType - One of IconType constants
     * @param {any} Gtk - GTK module reference
     * @returns {Gtk.Image|Gtk.Label}
     */
    createPrefsIcon(iconType, Gtk) {
        const style = this.getIconStyle();
        
        if (style === 'freeicons' || style === 'material') {
            const gicon = this._createFileIcon(iconType, style);
            const cssClass = GTK_CSS_CLASS_MAP[iconType];
            
            const icon = new Gtk.Image({
                gicon: gicon,
                pixel_size: 26,
            });
            
            if (cssClass) {
                icon.add_css_class(cssClass);
            }
            
            return icon;
        } else {
            return new Gtk.Label({
                label: EMOJI_MAP[iconType] || '❓',
                xalign: 0,
            });
        }
    }
    
    /**
     * Update existing preferences icon widget
     * @param {any} widget - Gtk.Image or Gtk.Label
     * @param {string} iconType - One of IconType constants
     */
    updatePrefsIcon(widget, iconType) {
        const style = this.getIconStyle();
        
        if (widget.constructor.name === 'GtkImage') {
            if (style === 'freeicons' || style === 'material') {
                const gicon = this._createFileIcon(iconType, style);
                const cssClass = GTK_CSS_CLASS_MAP[iconType];
                widget.set_from_gicon(gicon);
                widget.remove_css_class('success');
                widget.remove_css_class('error');
                widget.remove_css_class('warning');
                if (cssClass) {
                    widget.add_css_class(cssClass);
                }
            } else {
                // Switch to emoji label handled by prefs UI when rebuilding rows
            }
        } else if (widget.constructor.name === 'GtkLabel') {
            widget.set_label(EMOJI_MAP[iconType] || '❓');
        }
    }
    
    /**
     * Create file-based icon from icons subdirectory
     * @param {string} iconType - One of IconType constants
     * @param {string} styleDir - 'freeicons' or 'material'
     * @returns {Gio.FileIcon}
     * @private
     */
    _createFileIcon(iconType, styleDir) {
        const filename = ICON_FILENAMES[iconType];
        if (!filename) {
            throw new Error(`Unknown icon type: ${iconType}`);
        }
        
        const iconFile = this._extensionDir
            .get_child('icons')
            .get_child(styleDir)
            .get_child(filename);
        
        return new Gio.FileIcon({ file: iconFile });
    }
}
