import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';

export class NotificationManager {
    constructor(logger) {
        this._logger = logger;
        this._lastNotificationTime = 0;
    }
    
    notifyFailure(url) {
        const currentTime = GLib.get_real_time() / 1000000;
        const oneHour = 60 * 60;
        
        if (currentTime - this._lastNotificationTime < oneHour) {
            return;
        }
        
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
        this._lastNotificationTime = currentTime;
        this._logger.debug('Notification sent for failed URL', { url });
    }

    notifyForceRecheckComplete() {
        const source = new MessageTray.Source({
            title: '🤖 Ping Bot',
            iconName: 'emblem-default-symbolic'
        });
        
        Main.messageTray.add(source);
        
        const notification = new MessageTray.Notification({
            source: source,
            title: '🤖 Ping Bot',
            body: 'Force status recheck finished',
            isTransient: true
        });
        
        source.addNotification(notification);
        this._logger.debug('Notification sent for force recheck completion');
    }
}

