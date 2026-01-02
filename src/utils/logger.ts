const isDev = import.meta.env.DEV;

export const logger = {
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: any[]) => {
        // We allow errors to be shown in production for better debugging of critical issues
        // If you want to hide them too, uncomment the check below
        // if (isDev) {
        console.error(...args);
        // }
    },
    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    }
};
