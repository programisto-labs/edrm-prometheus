import client from 'prom-client';
import { EnduranceRouter, type SecurityOptions, EnduranceRequest } from 'endurance-core';

class PrometheusRouter extends EnduranceRouter {
  private register: any;
  private httpRequestDurationSeconds: any;
  private httpRequestErrorsTotal: any;

  constructor() {
    super();
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const isPrometheusActivated = process.env.PROMETHEUS_ACTIVATED !== 'false';

    if (isPrometheusActivated) {
      this.register = new client.Registry();
      client.collectDefaultMetrics({ register: this.register });

      this.httpRequestDurationSeconds = new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 1.5, 2, 5]
      });

      this.httpRequestErrorsTotal = new client.Counter({
        name: 'http_request_errors_total',
        help: 'Total number of HTTP request errors',
        labelNames: ['method', 'route', 'status_code']
      });

      this.register.registerMetric(this.httpRequestDurationSeconds);
      this.register.registerMetric(this.httpRequestErrorsTotal);
    }
  }

  setupRoutes(): void {
    const isPrometheusActivated = process.env.PROMETHEUS_ACTIVATED !== 'false';

    if (isPrometheusActivated) {
      const metricsMiddleware = (req: EnduranceRequest, res: any, next: any) =>
        this.collectMetrics(req, res, next, this.httpRequestDurationSeconds, this.httpRequestErrorsTotal);

      this.router.use(metricsMiddleware);

      const securityOptions: SecurityOptions = {
        requireAuth: false
      };

      (this.router as any).get("/", securityOptions, (req: EnduranceRequest, res: any) =>
        this.getMetrics(req, res, this.register));
    }
  }

  private getMetrics(req: EnduranceRequest, res: any, register: any) {
    const allowedIPs = [process.env.PROMETHEUS_IP_ADDRESS, '127.0.0.1', '::1'];
    if (!allowedIPs.includes((req as any).ip)) {
      return res.status(403).send('Access forbidden');
    }
    res.set('Content-Type', register.contentType);
    register.metrics().then((data: any) => res.send(data));
  }

  private collectMetrics(req: EnduranceRequest, res: any, next: any, httpRequestDurationSeconds: any, httpRequestErrorsTotal: any) {
    const end = httpRequestDurationSeconds.startTimer();
    res.on('finish', () => {
      const labels = {
        method: (req as any).method,
        route: (req as any).route ? (req as any).route.path : (req as any).path,
        status_code: res.statusCode
      };
      end(labels);
      if (res.statusCode >= 400) {
        httpRequestErrorsTotal.inc(labels);
      }
    });
    next();
  }
}

export default new PrometheusRouter();