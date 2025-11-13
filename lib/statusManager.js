import GLib from 'gi://GLib';

export const PingStatus = {
    GREEN: 'green',
    YELLOW: 'yellow',
    RED: 'red'
};

export class StatusManager {
    constructor(settings) {
        this._settings = settings;
        this._urlStatuses = {};
        this._loadStatuses();
    }
    
    _loadStatuses() {
        try {
            const statusJson = this._settings.get_string('url-statuses');
            this._urlStatuses = JSON.parse(statusJson);
        } catch (e) {
            this._urlStatuses = {};
        }
    }
    
    _saveStatuses() {
        const statusJson = JSON.stringify(this._urlStatuses);
        this._settings.set_string('url-statuses', statusJson);
    }
    
    getStatus(url) {
        return this._urlStatuses[url] || PingStatus.YELLOW;
    }
    
    setStatus(url, status) {
        const oldStatus = this._urlStatuses[url];
        this._urlStatuses[url] = status;
        this._saveStatuses();
        return oldStatus;
    }
    
    setAllYellow(urls) {
        urls.forEach(url => {
            this._urlStatuses[url] = PingStatus.YELLOW;
        });
        this._saveStatuses();
    }
    
    getOverallStatus(urls) {
        if (urls.length === 0) {
            return PingStatus.YELLOW;
        }
        
        let hasRed = false;
        let hasYellow = false;
        
        for (const url of urls) {
            const status = this.getStatus(url);
            if (status === PingStatus.RED) {
                return PingStatus.RED;
            } else if (status === PingStatus.YELLOW) {
                hasYellow = true;
            }
        }
        
        return hasYellow ? PingStatus.YELLOW : PingStatus.GREEN;
    }
}
