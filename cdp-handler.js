const WebSocket = require('ws');
const http = require('http');

class CDPHandler {
    constructor(logger = console.log) {
        this.logger = logger;
        this.connections = new Map(); // id -> ws
        this.msgId = 1;
        this.targetPorts = [9000, 9222];
    }

    log(msg) {
        this.logger(`[CDP] ${msg}`);
    }

    async isCDPAvailable() {
        for (const port of this.targetPorts) {
            const available = await new Promise((resolve) => {
                const req = http.get({
                    hostname: '127.0.0.1',
                    port,
                    path: '/json/version',
                    timeout: 500
                }, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
            });
            if (available) return true;
        }
        return false;
    }

    async scanAndInject(script) {
        for (const port of this.targetPorts) {
            try {
                const pages = await this._getPages(port);
                for (const page of pages) {
                    const title = (page.title || '').toLowerCase();
                    const url = (page.url || '').toLowerCase();

                    // Refined Quokka detection
                    const isQuokka = title.includes('quokka') ||
                        url.includes('quokka') ||
                        url.includes('wallabyjs');

                    // Refined Antigravity detection - more permissive for local development
                    const isAntigravity = (
                        title.includes('antigravity') ||
                        url.includes('antigravity.ai') ||
                        url.includes('localhost') ||
                        url.includes('127.0.0.1') ||
                        // If it's a page and not quokka/extension, it's likely our target in this context
                        (page.type === 'page' && !title.includes('extension') && !url.includes('extension'))
                    ) && !isQuokka;

                    // Log every page we see for diagnostics
                    this.log(`Page: "${page.title}" URL: ${page.url} [isAG: ${isAntigravity}, isQuokka: ${isQuokka}, type: ${page.type}]`);

                    if (isAntigravity && page.type === 'page') {
                        this.log(`>>> INJECTING into: ${page.title}`);
                        const result = await this._evaluate(page.webSocketDebuggerUrl, script);
                        if (result && result.result && result.result.value) {
                            this.log(`Result from ${page.title}: ${result.result.value}`);
                        }
                    }
                }
            } catch (e) {
                this.log(`Error scanning port ${port}: ${e.message}`);
            }
        }
    }

    async _getPages(port) {
        return new Promise((resolve) => {
            const req = http.get({
                hostname: '127.0.0.1',
                port,
                path: '/json/list'
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(body).filter(p => p.webSocketDebuggerUrl));
                    } catch (e) {
                        resolve([]);
                    }
                });
            });
            req.on('error', () => resolve([]));
            req.on('timeout', () => {
                req.destroy();
                resolve([]);
            });
        });
    }

    async _evaluate(wsUrl, expression) {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('Timeout'));
            }, 2000);

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    id: this.msgId++,
                    method: 'Runtime.evaluate',
                    params: {
                        expression,
                        userGesture: true,
                        awaitPromise: true,
                        returnByValue: true
                    }
                }));
            });

            ws.on('message', (data) => {
                clearTimeout(timeout);
                ws.close();
                resolve(JSON.parse(data.toString()));
            });

            ws.on('error', (e) => {
                clearTimeout(timeout);
                reject(e);
            });
        });
    }
}

module.exports = {
    CDPHandler
};