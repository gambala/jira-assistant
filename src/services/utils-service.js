import { SHORT_MONTH_NAMES, FULL_MONTH_NAMES, TINY_DAY_NAMES, SHORT_DAY_NAMES, FULL_DAY_NAMES } from '../constants/settings';
import { convertToDate, getUserName, parseJiraCustomCSV } from '../common/utils';

const secsPerDay = 86400;
const secsPerHour = 3600;

export default class UtilsService {
    convertDate = convertToDate;

    formatDate(date, format) {
        if (!(date instanceof Date)) {
            date = this.convertDate(date);
        }

        const yyyy = date.getFullYear().toString();
        const mmInt = date.getMonth();
        const mm = mmInt < 9 ? `0${mmInt + 1}` : (mmInt + 1).toString(); // getMonth() is zero-based
        const dd = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate().toString();
        const hhInt = date.getHours();
        const hh = hhInt < 10 ? `0${hhInt}` : hhInt.toString();
        const min = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes().toString();
        const ss = date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds().toString();
        const day = date.getDay();
        if (format) {
            return format
                .replace("yyyy", yyyy)
                .replace("yy", yyyy)
                .replace("MMMM", FULL_MONTH_NAMES[mmInt])
                .replace("MMM", SHORT_MONTH_NAMES[mmInt])
                .replace("MM", mm)
                .replace("DDDD", FULL_DAY_NAMES[day])
                .replace("DDD", SHORT_DAY_NAMES[day])
                .replace("dddd", FULL_DAY_NAMES[day])
                .replace("ddd", SHORT_DAY_NAMES[day])
                .replace("DD", TINY_DAY_NAMES[day])
                .replace("dd", dd)
                .replace("HH", hh)
                .replace("hh", (hhInt > 12 ? (hhInt - 12) : hh).toString())
                .replace("mm", min)
                .replace("ss", ss)
                .replace("tt", hhInt >= 12 ? "PM" : "AM");
        }
        else { return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss); }
    }

    formatDateTimeForJira(datetime) {
        if (!(datetime instanceof Date)) {
            datetime = this.convertDate(datetime);
        }

        return `${datetime.toISOString().replace('Z', '').replace('z', '')}+0000`;
    }

    formatDateForJira(date) {
        if (!(date instanceof Date)) {
            date = this.convertDate(date);
        }

        return date?.format("dd/MMM/yy");
    }

    getRowStatus(d) {
        let classNames = "";
        if (d.status) {
            classNames += (d.status.name || d.status).toLowerCase() === "closed" ? "closed " : "";
        }
        if (d.difference) {
            const secsDiff = this.getTotalSecs(d.difference);
            if (secsDiff > 0) { classNames += "log-high "; }
            else if (secsDiff < 0) { classNames += "log-less "; }
        } else if (d.difference === 0) {
            classNames += "log-good ";
        }
        return classNames;
    }

    getTotalSecs(ts) {
        if (typeof ts === "string") {
            let num = null;
            if (!ts || (num = ts.split(':')).length < 2) {
                return ts;
            }
            let secs = parseInt(num[0], 0) * 60 * 60;
            secs += parseInt(num[1], 0) * 60;
            if (num.length > 2) { secs += parseInt(num[2], 0); }
            return secs;
        }
        else if (typeof ts === "number") {
            return ts / 1000;
        }
    }

    getDateArray(startDate, endDate) {
        const retVal = [];
        let current = new Date(startDate);
        while (current <= endDate) {
            retVal.push(new Date(current));
            current = current.addDays(1);
        }
        return retVal;
    }


    yesno(val) {
        if (val === true) {
            return "Yes";
        }
        else if (val === false) {
            return "Yes";
        }
        else {
            return val;
        }
    }

    avg(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.avg((v) => v[prop]);
        }
        else {
            return arr.avg();
        }
    }

    sum(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) { return arr.sum((v) => v[prop]); }
        else { return arr.sum(); }
    }

    min(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.min((v) => v[prop]);
        }
        else {
            return arr.min();
        }
    }
    max(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) { return arr.max((v) => v[prop]); }
        else { return arr.max(); }
    }
    bytes(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) { return '-'; }
        if (typeof precision === 'undefined') {
            precision = 1;
        }
        const units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'], number = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, Math.floor(number))).toFixed(precision)} ${units[number]}`;
    }
    convertSecs = (d, opts) => {
        if (!opts) {
            opts = {};
        }
        if (!d) {
            return opts.showZeroSecs ? 0 : "";
        }
        else if (Array.isArray(d)) {
            d = d.sum();
        }
        d = Number(d);
        if (opts.format) {
            return this.formatSecs(d, opts.showZeroSecs);
        }
        else {
            return parseFloat(((d / 3600).toFixed(4)));
        }
    };
    count(arr, prop) {
        if (!arr) {
            return null;
        }
        if (prop) {
            return arr.count((v) => v[prop]);
        }
        else {
            return arr.count();
        }
    }
    cut(value, max, wordwise, tail) {
        if (!value || max === -1) { return value; }
        max = parseInt(max || 20, 10);
        if (!max) { return value; }
        if (value.length <= max) { return value; }
        value = value.substr(0, max);
        if (wordwise) {
            let lastspace = value.lastIndexOf(' ');
            if (lastspace !== -1) {
                //Also remove . and , so it gives a cleaner result.
                if (value.charAt(lastspace - 1) === '.' || value.charAt(lastspace - 1) === ',') {
                    lastspace = lastspace - 1;
                }
                value = value.substr(0, lastspace);
            }
        }
        return value + (tail || '...');
    }
    formatSecs = (d, showZeroSecs, simple, days) => {
        if (d === 0) {
            return showZeroSecs ? "0s" : "";
        }
        if (d && Array.isArray(d)) {
            d = d.sum();
        }
        d = Number(d);
        let prefix = "";
        if (d < 0) {
            prefix = "-";
            d = Math.abs(d);
        }

        let day, h, m, s;
        if (days) {
            day = Math.floor(d / secsPerDay);
            d = d % secsPerDay;
            h = Math.floor(d / secsPerHour);
            m = Math.floor(d % secsPerHour / 60);
            s = Math.floor(d % secsPerHour % 60);
        }
        else {
            h = Math.floor(d / secsPerHour);
            m = Math.floor(d % secsPerHour / 60);
            s = Math.floor(d % secsPerHour % 60);
        }

        if (simple) {
            return `${prefix}${(day > 0 ? `${day.pad(2)}:` : "")}${(h > 0 ? h.pad(2) : "00")}:${m > 0 ? m.pad(2) : "00"}`;
        }
        else {
            return prefix + ((day > 0 ? `${day}d ` : "") + (h > 0 ? `${h}h ` : "") + (m > 0 ? `${m}m ` : "") + (s > 0 ? `${s}s` : "")).trim();
        }
    };

    formatTs = (d, simple) => this.formatSecs(this.getTotalSecs(d), false, simple);

    formatUser(obj, fields) {
        if (!obj) {
            return null;
        }
        switch (fields) {
            case "EM": return obj.emailAddress;
            case "LG": return getUserName(obj);
            case "NE": return `${obj.displayName} (${obj.emailAddress})`;
            case "NL": return `${obj.displayName} (${getUserName(obj)})`;
            default: return obj.displayName;
        }
    }
    propOfNthItem(arr, index, prop, fromCsv) {
        if (!arr) { return null; }
        if (!Array.isArray(arr)) { return "#Error:Array expected"; }
        if (!arr.length) { return null; }
        if (typeof index === "string" && isNaN(Number(index))) {
            if (index === "last") { index = arr.length - 1; }
        }
        index = Number(index);
        if (!isNaN(index)) {
            index = index - 0;
            if (index < 0) { return "#Error:Out of L Bound"; }
            if (index >= arr.length) { return "#Error:Out of U Bound"; }
        }
        return this.getProperty(arr[index], prop, fromCsv);
    }
    getProperty(object, prop, fromCsv) {
        if (!object) {
            return object;
        }
        if (fromCsv && typeof object === "string") {
            object = this.convertCustObj(object);
        }
        if (!prop) { return object; }
        return object[prop];
    }
    convertCustObj(obj) {
        let i;
        if (Array.isArray(obj)) {
            const arr = [];
            for (i = 0; i < obj.length; i++) {
                arr[i] = this.convertCustObj(obj[i]);
            }
            return arr;
        }
        else {
            if (typeof obj === "string") {
                return parseJiraCustomCSV(obj);
            }
            else { return obj; }
        }
    }
}
