import Gio from 'gi://Gio';
import {PingStatus} from './statusManager.js';

const PING_PREFIX = 'ping://';

export class IpPinger {
    constructor(settings, statusManager, logger) {
        this._settings = settings;
        this._statusManager = statusManager;
        this._logger = logger;
        this._cancellables = new Map();
    }

    pingHost(target, onStatusChanged) {
        const host = target.startsWith(PING_PREFIX) ? target.slice(PING_PREFIX.length) : target;
        const timeoutSeconds = this._settings.get_int('request-timeout');

        const existing = this._cancellables.get(target);
        if (existing) existing.cancel();

        const cancellable = new Gio.Cancellable();
        this._cancellables.set(target, cancellable);

        try {
            const proc = new Gio.Subprocess({
                argv: ['ping', '-c', '1', '-W', String(timeoutSeconds), host],
                flags: Gio.SubprocessFlags.STDOUT_SILENCE | Gio.SubprocessFlags.STDERR_SILENCE,
            });
            proc.init(cancellable);

            proc.wait_async(cancellable, (p, result) => {
                this._cancellables.delete(target);
                let reachable = false;
                try {
                    p.wait_finish(result);
                    reachable = p.get_successful();
                } catch (e) {
                    if (e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED))
                        return;
                    this._logger.error(`Failed to ping ${host}`, e);
                }

                const newStatus = reachable ? PingStatus.GREEN : PingStatus.RED;
                const oldStatus = this._statusManager.setStatus(target, newStatus);
                this._logger.debug(`IP ping ${reachable ? 'OK' : 'FAILED'}`, { host });

                if (onStatusChanged)
                    onStatusChanged(target, oldStatus, newStatus);
            });
        } catch (e) {
            this._cancellables.delete(target);
            this._logger.error(`Failed to start ping process for ${host}`, e);
            const oldStatus = this._statusManager.setStatus(target, PingStatus.RED);
            if (onStatusChanged)
                onStatusChanged(target, oldStatus, PingStatus.RED);
        }
    }

    pingAll(targets, onStatusChanged, onFinished) {
        if (targets.length === 0) {
            if (onFinished) onFinished();
            return;
        }

        this._logger.debug(`Pinging ${targets.length} IP hosts`);
        let completed = 0;
        const total = targets.length;

        targets.forEach(target => this.pingHost(target, (t, o, n) => {
            if (onStatusChanged) onStatusChanged(t, o, n);
            completed++;
            if (completed === total && onFinished) onFinished();
        }));
    }

    destroy() {
        this._cancellables.forEach(c => c.cancel());
        this._cancellables.clear();
    }
}
