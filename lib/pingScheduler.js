import GLib from 'gi://GLib';
import {PingStatus} from './statusManager.js';

const PING_PREFIX = 'ping://';

export class PingScheduler {
    constructor(settings, statusManager, urlPinger, ipPinger, notificationManager, onStatusUpdate, logger) {
        this._settings = settings;
        this._statusManager = statusManager;
        this._urlPinger = urlPinger;
        this._ipPinger = ipPinger;
        this._notificationManager = notificationManager;
        this._onStatusUpdate = onStatusUpdate;
        this._logger = logger;
        this._timeoutId = null;
    }
    
    start() {
        this.stop();
        
        const intervalMinutes = this._settings.get_int('ping-interval');
        const intervalMs = intervalMinutes * 60 * 1000;
        
        this._logger.debug(`Starting ping scheduler. Interval: ${intervalMinutes} minutes`);
        
        this._pingAllUrls();
        
        this._timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, intervalMs, () => {
            this._logger.debug('Ping timer triggered');
            this._pingAllUrls();
            return GLib.SOURCE_CONTINUE;
        });
    }
    
    stop() {
        if (this._timeoutId) {
            this._logger.debug('Stopping ping scheduler');
            GLib.Source.remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    forceRecheck() {
        this._logger.debug('Force recheck requested');
        const targets = this._settings.get_strv('ping-urls');
        this._statusManager.setAllYellow(targets);
        
        if (this._onStatusUpdate) {
            this._onStatusUpdate();
        }
        
        this._pingAllUrls(() => {
            this._notificationManager.notifyForceRecheckComplete();
        });
    }
    
    _pingAllUrls(onFinished) {
        const allTargets = this._settings.get_strv('ping-urls');
        const httpTargets = allTargets.filter(t => !t.startsWith(PING_PREFIX));
        const ipTargets = allTargets.filter(t => t.startsWith(PING_PREFIX));

        let remaining = 2;
        const checkFinished = () => {
            remaining--;
            if (remaining === 0 && onFinished) onFinished();
        };

        const handleStatusChange = (target, oldStatus, newStatus) => {
            if (this._onStatusUpdate) this._onStatusUpdate();
            if (target && newStatus === PingStatus.RED && oldStatus !== PingStatus.RED)
                this._notificationManager.notifyFailure(target);
        };

        this._urlPinger.pingAll(httpTargets, handleStatusChange, checkFinished);
        this._ipPinger.pingAll(ipTargets, handleStatusChange, checkFinished);
    }
}
