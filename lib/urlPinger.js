import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import {PingStatus} from './statusManager.js';

export class UrlPinger {
    constructor(settings, statusManager, logger) {
        this._settings = settings;
        this._statusManager = statusManager;
        this._logger = logger;
        this._sessions = new Map();
    }

    pingUrl(url, onStatusChanged) {
        const timeoutSeconds = this._settings.get_int('request-timeout');
        const session = new Soup.Session({
            timeout: timeoutSeconds,
            user_agent: 'PingBot/1.0.7 GNOME Shell Extension (+https://github.com/lauzis/pingbot; https://extensions.gnome.org/extension/8777/ping-bot/)',
        });
        const message = Soup.Message.new('GET', url);

        this._sessions.set(url, session);

        session.send_and_read_async(
            message,
            GLib.PRIORITY_DEFAULT,
            null,
            (sess, result) => {
                this._sessions.delete(url);

                try {
                    sess.send_and_read_finish(result);
                    const statusCode = message.get_status();
                    const newStatus = statusCode === 200 ? PingStatus.GREEN : PingStatus.RED;
                    const oldStatus = this._statusManager.setStatus(url, newStatus);

                    this._logger.debug(`URL ping ${statusCode === 200 ? 'OK' : 'FAILED'}`, { url, statusCode });

                    if (onStatusChanged) {
                        onStatusChanged(url, oldStatus, newStatus);
                    }
                } catch (e) {
                    const oldStatus = this._statusManager.setStatus(url, PingStatus.RED);
                    this._logger.error(`Failed to ping ${url}`, e);

                    if (onStatusChanged) {
                        onStatusChanged(url, oldStatus, PingStatus.RED);
                    }
                }
            }
        );
    }

    pingAll(urls, onStatusChanged, onFinished) {
        const monitor = Gio.NetworkMonitor.get_default();
        const hasNetwork = monitor.get_network_available() &&
                          monitor.get_connectivity() === Gio.NetworkConnectivity.FULL;

        if (!hasNetwork) {
            this._logger.debug('No network connection, setting all URLs to yellow');
            this._statusManager.setAllYellow(urls);
            if (onStatusChanged) {
                onStatusChanged(null, null, null);
            }
            if (onFinished) {
                onFinished();
            }
            return;
        }

        if (urls.length === 0) {
            this._logger.debug('No URLs to ping');
            if (onFinished) {
                onFinished();
            }
            return;
        }

        this._logger.debug(`Pinging ${urls.length} URLs`);
        
        let completed = 0;
        const total = urls.length;
        
        urls.forEach(url => this.pingUrl(url, (u, o, n) => {
            if (onStatusChanged) {
                onStatusChanged(u, o, n);
            }
            completed++;
            if (completed === total && onFinished) {
                onFinished();
            }
        }));
    }

    destroy() {
        this._sessions.forEach(session => session.abort());
        this._sessions.clear();
    }
}

