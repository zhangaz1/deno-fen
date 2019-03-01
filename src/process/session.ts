import {cookieReader, cookie2String} from '../tool/cookie.ts';

interface ISessionConfig {
    name?: string,
    maxAge?: number,
    httpOnly?: boolean,
    forceSetHeader?: boolean,
    secure: boolean
}

function getRandomId() {
    return Math.random().toString(16).slice(-7);
}

export default class Session {
    pool = new Map<string, Map<string, any>>();
    timePool = new Map<string, Date>();
    config:ISessionConfig = {
        name: 'fen-session',
        maxAge: 86400000,
        httpOnly: true,
        forceSetHeader: false,
        secure: false
    };

    constructor(config) {
        this.config = {...this.config, ...config}
    }
    
    process = async(context) => {
        const {headers} = context.request;
        const cookieStr = headers.has('cookie') ? headers.get('cookie') : "";
        let {name, secure, forceSetHeader, httpOnly, maxAge} = this.config;
        const cookie = cookieReader(cookieStr);
        const setCookie = new Map<string, string>();
        const time = +(new Date());
        let id;

        if(!cookie.has(name)) {
            id = getRandomId();
            forceSetHeader = true;
        } else {
            id = cookie.get(name)
        }

        if(!this.pool.has(id)) {
            this.pool.set(id, new Map<string, any>());
        }

        const pool = this.pool.get(id);

        if (forceSetHeader) {
            setCookie.set(name, id);
            if (httpOnly) {setCookie.set('HttpOnly', '')}
            if (secure) {setCookie.set('Secure', '')}
            if (maxAge) {
                setCookie.set('Max-Age', Math.round(maxAge / 1000).toString());
                setCookie.set('Expires', (new Date(time + maxAge)).toUTCString())
            }
            headers.append('set-cookie', cookie2String(setCookie));
        }

        if(pool) {
            context.session = pool;
        }

        return context;
    }
}