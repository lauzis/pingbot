import GLib from 'gi://GLib';

export class Logger {
    constructor(domain) {
        this._domain = domain;
        this._debugEnabled = this._isDebugEnabled(domain);
    }
    
    _isDebugEnabled(domain) {
        const debugEnv = GLib.getenv('G_MESSAGES_DEBUG');
        if (!debugEnv) return false;
        return debugEnv === 'all' || debugEnv.split(',').includes(domain);
    }
    
    debug(message, context = null) {
        if (!this._debugEnabled) return;
        
        let logMessage = `[${this._domain}] DEBUG: ${message}`;
        if (context) {
            logMessage += ` ${JSON.stringify(context)}`;
        }
        log(logMessage);
    }
    
    info(message) {
        log(`[${this._domain}] ${message}`);
    }
    
    error(message, error = null) {
        const errorMessage = error ? `: ${error.message}` : '';
        logError(`[${this._domain}] ERROR`, `${message}${errorMessage}`);
    }
    
    warn(message) {
        log(`[${this._domain}] WARNING: ${message}`);
    }
}
