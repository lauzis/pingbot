import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import {StatusManager} from './lib/statusManager.js';
import {UrlPinger} from './lib/urlPinger.js';
import {NotificationManager} from './lib/notificationManager.js';
import {PanelIndicator} from './lib/panelIndicator.js';
import {PingScheduler} from './lib/pingScheduler.js';
import {Logger} from './lib/logger.js';

export default class PingBotExtension extends Extension {
    enable() {
        // custom logger/wrapper for easier debugging
        this._logger = new Logger('pingbot');

        // settings and core components
        this._settings = this.getSettings();

        // changes the stats of the icons based on URL statuses
        this._statusManager = new StatusManager(this._settings);

        // pings urls and triggers status updates
        this._urlPinger = new UrlPinger(this._settings, this._statusManager, this._logger);

        // if some url goes red, notify the user
        this._notificationManager = new NotificationManager(this._logger);

        // panels indicator in the top bar
        this._panelIndicator = new PanelIndicator(
            this.metadata.uuid,
            this.metadata.name,
            this._settings,
            this._statusManager,
            () => this.openPreferences(),
            this._logger
        );

        // scheduler that periodically pings the URLs and status updates
        this._pingScheduler = new PingScheduler(
            this._settings,
            this._statusManager,
            this._urlPinger,
            this._notificationManager,
            () => this._updateMainStatus()
        );

        // initial setupp, status update and start pinging urls
        this._updateMainStatus();
        this._panelIndicator.buildMenu();
        this._pingScheduler.start();
        this._connectSignals();

        this._logger.info('Ping Bot enabled');
    }

    disable() {
        // stop actions and remove ux elements
        if (this._pingScheduler) {
            this._pingScheduler.stop();
            this._pingScheduler = null;
        }

        if (this._urlPinger) {
            this._urlPinger.destroy();
            this._urlPinger = null;
        }

        if (this._panelIndicator) {
            this._panelIndicator.destroy();
            this._panelIndicator = null;
        }

        this._logger.info('Ping Bot disabled');

        this._settings = null;
        this._statusManager = null;
        this._notificationManager = null;
        this._logger = null;
    }

    _connectSignals() {
        this._settings.connect('changed::ping-urls', () => {
            this._panelIndicator.buildMenu();
        });
        this._settings.connect('changed::url-statuses', () => {
            this._updateMainStatus();
            this._panelIndicator.buildMenu();
        });
    }

    _updateMainStatus() {
        const urls = this._settings.get_strv('ping-urls');
        const status = this._statusManager.getOverallStatus(urls);
        this._panelIndicator.updateStatus(status);
    }
}



