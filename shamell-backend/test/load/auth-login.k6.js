import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

/**
 * Load/concurrency test on POST /api/v1/auth/admin/login.
 * Run ONLY against local or staging, never production.
 *
 * Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
 * Run:        k6 run test/load/auth-login.k6.js -e BASE_URL=http://localhost:3001
 *
 * Business rules exercised (AuthController):
 *   - wrong credentials → 401
 *   - more than 10 attempts/min from the same IP → 429 (ThrottlerGuard)
 */
export const options = {
  scenarios: {
    login_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    server_errors: ['rate<0.01'], // < 1% 5xx
    rate_limited: ['rate>0'], // throttling must kick in under load
  },
};

// 401 and 429 are the expected answers here, not failures.
http.setResponseCallback(http.expectedStatuses(200, 401, 429));

const serverErrors = new Rate('server_errors');
const rateLimited = new Rate('rate_limited');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export default function () {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/admin/login`,
    JSON.stringify({ email: 'admin@shamell.com', password: 'wrong-password' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  serverErrors.add(res.status >= 500);
  rateLimited.add(res.status === 429);

  check(res, {
    'never 5xx': (r) => r.status < 500,
    'only 401 or 429': (r) => r.status === 401 || r.status === 429,
    'answers in < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
