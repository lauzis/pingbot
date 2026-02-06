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

const SVG_TEMPLATES = {
    'robot': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="3" r="1.5"/><rect x="4" y="5" width="8" height="8" rx="1"/><circle cx="6" cy="8" r="1"/><circle cx="10" cy="8" r="1"/><rect x="6" y="11" width="4" height="1"/></svg>',
    
    'status-green': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" stroke-width="1.5" fill="none"/><path d="M 5 8 L 7 10 L 11 6" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    'status-yellow': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" stroke-width="1.5" fill="none"/><path d="M 8 5 L 8 9" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.5"/></svg>',
    
    'status-red': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" stroke-width="1.5" fill="none"/><path d="M 6 6 L 10 10 M 10 6 L 6 10" stroke-width="1.5" stroke-linecap="round"/></svg>',
    
    'refresh': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><path d="M 8 2 A 6 6 0 0 1 14 8 A 6 6 0 0 1 8 14 A 6 6 0 0 1 2 8 A 6 6 0 0 1 6 3" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M 6 1 L 6 4 L 3 4" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    
    'settings': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="2" stroke-width="1.5" fill="none"/><path d="M 8 1 L 8 3 M 8 13 L 8 15 M 15 8 L 13 8 M 3 8 L 1 8 M 12.5 3.5 L 11 5 M 5 11 L 3.5 12.5 M 12.5 12.5 L 11 11 M 5 5 L 3.5 3.5" stroke-width="1.5" stroke-linecap="round"/></svg>',
};

const EMOJI_MAP = {
    'status-green': '🟢',
    'status-yellow': '🟡',
    'status-red': '🔴',
    'robot': '🤖',
    'refresh': '🔄',
    'settings': '⚙️',
};

const COLOR_MAP = {
    'status-green': '#2ecc71',
    'status-yellow': '#f1c40f',
    'status-red': '#e74c3c',
    'robot': 'currentColor',
    'refresh': 'currentColor',
    'settings': 'currentColor',
};

// GTK symbolic icon names for preferences
const GTK_ICON_MAP = {
    'status-green': 'emblem-ok-symbolic',
    'status-yellow': 'dialog-question-symbolic',
    'status-red': 'dialog-error-symbolic',
    'robot': 'computer-symbolic',
    'refresh': 'view-refresh-symbolic',
    'settings': 'emblem-system-symbolic',
};

// Shell symbolic icon names for panel (when using symbolic style)
const SHELL_SYMBOLIC_ICON_MAP = {
    'status-green': 'emblem-default-symbolic',
    'status-yellow': 'dialog-warning-symbolic',
    'status-red': 'dialog-error-symbolic',
    'robot': 'computer-symbolic',
    'refresh': 'view-refresh-symbolic',
    'settings': 'emblem-system-symbolic',
};

const GTK_CSS_CLASS_MAP = {
    'status-green': 'success',
    'status-yellow': 'warning',
    'status-red': 'error',
};

export class IconHelper {
    constructor(settings) {
        this._settings = settings;
    }
    
    /**
     * Get icon style from settings
     * @returns {string} 'material' or 'emoji'
     */
    getIconStyle() {
        return this._settings.get_string('icon-style');
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
     * @returns {Gio.BytesIcon|Gio.ThemedIcon|string} BytesIcon for material, ThemedIcon for symbolic, string for emoji
     */
    createPanelIcon(iconType) {
        const style = this.getIconStyle();
        
        if (style === 'symbolic') {
            const iconName = SHELL_SYMBOLIC_ICON_MAP[iconType];
            if (iconName) {
                return Gio.ThemedIcon.new(iconName);
            }
            // Fallback to emoji if no symbolic icon defined
            return EMOJI_MAP[iconType] || '❓';
        } else if (style === 'material') {
            return this._createSvgIcon(iconType);
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
     * Create status widget for GTK preferences based on current style setting
     * @param {string} iconType - One of IconType constants
     * @param {any} Gtk - GTK module reference
     * @returns {Gtk.Image|Gtk.Label}
     */
    createPrefsIcon(iconType, Gtk) {
        const style = this.getIconStyle();
        
        if (style === 'symbolic') {
            const iconName = GTK_ICON_MAP[iconType];
            const cssClass = GTK_CSS_CLASS_MAP[iconType];
            
            if (!iconName) {
                // Fallback for non-status icons
                return new Gtk.Label({
                    label: EMOJI_MAP[iconType] || '❓',
                    xalign: 0,
                });
            }
            
            const icon = new Gtk.Image({
                icon_name: iconName,
                pixel_size: 16,
            });
            
            if (cssClass) {
                icon.add_css_class(cssClass);
            }
            
            return icon;
        } else if (style === 'material') {
            // Show Material SVG in prefs using Gio.BytesIcon
            return new Gtk.Image({
                gicon: this._createSvgIcon(iconType),
                pixel_size: 16,
            });
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
            if (style === 'symbolic') {
                const iconName = GTK_ICON_MAP[iconType];
                const cssClass = GTK_CSS_CLASS_MAP[iconType];
                if (iconName) {
                    widget.set_from_icon_name(iconName);
                    widget.remove_css_class('success');
                    widget.remove_css_class('error');
                    widget.remove_css_class('warning');
                    if (cssClass) {
                        widget.add_css_class(cssClass);
                    }
                }
            } else if (style === 'material') {
                widget.set_from_gicon(this._createSvgIcon(iconType));
            } else {
                // Switch to emoji label handled by prefs UI when rebuilding rows
            }
        } else if (widget.constructor.name === 'GtkLabel') {
            widget.set_label(EMOJI_MAP[iconType] || '❓');
        }
    }
    
    // Private helper to create SVG icon
    _createSvgIcon(iconType) {
        const svgContent = SVG_TEMPLATES[iconType];
        const color = COLOR_MAP[iconType];
        
        if (!svgContent) {
            throw new Error(`Unknown icon type: ${iconType}`);
        }
        
        // Add stroke and fill colors to SVG elements
        let coloredSvg = svgContent.replace(/stroke-width=/g, `stroke="${color}" stroke-width=`);
        coloredSvg = coloredSvg.replace(/<circle/g, `<circle fill="${color}"`);
        coloredSvg = coloredSvg.replace(/<rect/g, `<rect fill="${color}"`);
        
        const bytes = new TextEncoder().encode(coloredSvg);
        const gbytes = new GLib.Bytes(bytes);
        return new Gio.BytesIcon({ bytes: gbytes });
    }
}
