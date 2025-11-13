import GLib from 'gi://GLib';
import {PingStatus} from './statusManager.js';

export class PingScheduler {
    constructor(settings, statusManager, urlPinger, notificationManager, onStatusUpdate) {
        this._settings = settings;
        this._statusManager = statusManager;
        this._urlPinger = urlPinger;
        this._notificationManager = notificationManager;
        this._onStatusUpdate = onStatusUpdate;
        this._timeoutId = null;
    }
    
    start() {
        this.stop();
        
        const intervalMinutes = this._settings.get_int('ping-interval');
        const intervalMs = intervalMinutes * 60 * 1000;
        
        this._pingAllUrls();
        
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, intervalMs, () => {
            this._pingAllUrls();
            return GLib.SOURCE_CONTINUE;
        });
    }
    
    stop() {
        if (this._timeoutId) {
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
    }
    
    _pingAllUrls() {
        const urls = this._settings.get_strv('ping-urls');
        this._urlPinger.pingAll(urls, (url, oldStatus, newStatus) => {
            if (this._onStatusUpdate) {
                this._onStatusUpdate();
            }
            
            if (url && newStatus === PingStatus.RED && oldStatus !== PingStatus.RED) {
                this._notificationManager.notifyFailure(url);
            }
        });
    }
}
