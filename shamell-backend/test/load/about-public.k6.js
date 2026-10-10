import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const options = {
  scenarios: {
    public_about_soak: {
      executor: 'constant-vus',
      vus: 50,
      duration: '20s',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<100'],
    server_errors: ['rate<0.01'],
    rate_limited: ['rate>0'], // Expect Throttler to kick in!
  },
};

const serverErrors = new Rate('server_errors');
const rateLimited = new Rate('rate_limited');
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/about`);
  
  serverErrors.add(res.status >= 500);
  rateLimited.add(res.status === 429);

  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'never 5xx': (r) => r.status < 500,
  });

  sleep(0.05);
}
