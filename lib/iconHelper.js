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
    'robot': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M160-120v-80h80v-440q0-33 23.5-56.5T320-720h80v-80q0-33 23.5-56.5T480-880q33 0 56.5 23.5T560-800v80h80q33 0 56.5 23.5T720-640v440h80v80H160Zm200-240q17 0 28.5-11.5T400-400q0-17-11.5-28.5T360-440q-17 0-28.5 11.5T320-400q0 17 11.5 28.5T360-360Zm240 0q17 0 28.5-11.5T640-400q0-17-11.5-28.5T600-440q-17 0-28.5 11.5T560-400q0 17 11.5 28.5T600-360ZM320-560h320v-80H320v80Z"/></svg>',
    
    'status-green': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m424-408-86-86q-11-11-28-11t-28 11q-11 11-11 28t11 28l114 114q12 12 28 12t28-12l226-226q11-11 11-28t-11-28q-11-11-28-11t-28 11L424-408Zm56 328q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>',
    
    'status-yellow': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm0-160q17 0 28.5-11.5T520-480v-160q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640v160q0 17 11.5 28.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>',
    
    'status-red': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm0-160q17 0 28.5-11.5T520-480v-160q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640v160q0 17 11.5 28.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>',
    
    'refresh': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110q0-17 11.5-28.5T760-840q17 0 28.5 11.5T800-800v200q0 17-11.5 28.5T760-560H560q-17 0-28.5-11.5T520-600q0-17 11.5-28.5T560-640h128q-32-56-87.5-88T480-760q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116q5-16 18.5-23t29.5-2q16 5 23 19.5t2 30.5q-32 90-114 142.5T480-160Z"/></svg>',
    
    'settings': '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z"/></svg>',
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
};

// Shell symbolic icon names for panel (when using symbolic style)
const SHELL_SYMBOLIC_ICON_MAP = {
    'status-green': 'emblem-default-symbolic',
    'status-yellow': 'dialog-warning-symbolic',
    'status-red': 'dialog-error-symbolic',
    'robot': 'auth-face-symbolic',
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
        const Gtk = widget.constructor.toString().includes('Gtk') ? widget.constructor : null;
        
        if (style === 'symbolic' && widget.constructor.name === 'GtkImage') {
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
        
        const coloredSvg = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);
        const bytes = new TextEncoder().encode(coloredSvg);
        const gbytes = new GLib.Bytes(bytes);
        return new Gio.BytesIcon({ bytes: gbytes });
    }
}
