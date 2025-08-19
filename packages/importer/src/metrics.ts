import client from 'prom-client';
import http from 'http';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const registry = new client.Registry();
registry.setDefaultLabels({app: 'stinky-socks-importer'});
collectDefaultMetrics({register: registry});

http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
        res.setHeader('Content-Type', registry.contentType);
        res.end(await registry.metrics());
    } else {
        res.statusCode = 404;
        res.end();
    }
}).listen(9100, () => console.log("Metrics @ :9100/metrics"));