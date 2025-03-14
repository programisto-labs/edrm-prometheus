import client from 'prom-client';
import { createRouter } from 'endurance-core';
const router = createRouter();
const isPrometheusActivated = process.env.PROMETHEUS_ACTIVATED !== 'false';

if (isPrometheusActivated) {
  const register = new client.Registry();

  client.collectDefaultMetrics({ register });

  const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 1.5, 2, 5]
  });

  const httpRequestErrorsTotal = new client.Counter({
    name: 'http_request_errors_total',
    help: 'Total number of HTTP request errors',
    labelNames: ['method', 'route', 'status_code']
  });

  register.registerMetric(httpRequestDurationSeconds);
  register.registerMetric(httpRequestErrorsTotal);

  function getMetrics(req: any, res: any) {
    const allowedIPs = [process.env.PROMETHEUS_IP_ADDRESS, '127.0.0.1', '::1'];
    if (!allowedIPs.includes(req.ip)) {
      return res.status(403).send('Access forbidden');
    }
    res.set('Content-Type', register.contentType);
    register.metrics().then((data) => res.send(data));
  }

  function collectMetrics(req: any, res: any, next: any) {
    const end = httpRequestDurationSeconds.startTimer();
    res.on('finish', () => {
      const labels = { method: req.method, route: req.route ? req.route.path : req.path, status_code: res.statusCode };
      end(labels);
      if (res.statusCode >= 400) {
        httpRequestErrorsTotal.inc(labels);
      }
    });
    next();
  }

  router.use((req: any, res: any, next: any) => collectMetrics(req, res, next));
  router.get("/", getMetrics);
}

export default router;