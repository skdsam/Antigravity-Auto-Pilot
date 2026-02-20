const http = require('http');

async function checkPort(port) {
    return new Promise((resolve) => {
        const req = http.get({
            hostname: '127.0.0.1',
            port,
            path: '/json/version',
            timeout: 200
        }, (res) => {
            if (res.statusCode === 200) {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        port,
                        body
                    });
                });
            } else {
                resolve(null);
            }
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
    });
}

async function scan() {
    const ports = [];
    for (let i = 9000; i <= 9300; i++) ports.push(i);
    for (let i = 20000; i <= 20100; i++) ports.push(i);

    console.log('Scanning...');
    const results = await Promise.all(ports.map(p => checkPort(p)));

    for (const res of results) {
        if (res) {
            console.log(`Port ${res.port} is open: ${res.body}`);
        }
    }
}

scan();