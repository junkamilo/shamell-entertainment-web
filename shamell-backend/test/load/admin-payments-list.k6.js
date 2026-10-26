import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * Load + spike test on the admin payments dashboard:
 *   GET /api/v1/admin/payments        (paginated UNION over every payment table)
 *   GET /api/v1/admin/payments/badge  (polled by every open admin tab)
 * Run ONLY against local or staging, never production.
 *
 * Prepare (real DB, ~30k payment rows) and get an ADMIN token:
 *   npm run test:db:up
 *   node scripts/seed-admin-payments-load.mjs > tmp/admin-token.txt
 *   (start the API with DATABASE_URL/JWT_SECRET pointing at the test DB)
 * Run:
 *   k6 run test/load/admin-payments-list.k6.js -e BASE_URL=http://localhost:3001 -e TOKEN=$(cat tmp/admin-token.txt)
 *
 * Business rules exercised (AdminPaymentsController):
 *   - valid ADMIN token → 200
 *   - more than 120 req/min from the same IP → 429 (ThrottlerGuard)
 *   - never 5xx, whatever the filters or page
 */
export const options = {
  scenarios: {
    // Sustained dashboard usage just under the 120/min limit: filters, search
    // and deep pages over the whole table → slow queries, N+1, missing indexes.
    dashboard_load: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1m',
      duration: '1m',
      preAllocatedVUs: 10,
      exec: 'browseList',
    },
    // Many admin tabs reopening at once → badge polling avalanche.
    badge_spike: {
      executor: 'ramping-arrival-rate',
      startTime: '10s',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      stages: [
        { duration: '5s', target: 100 },
        { duration: '10s', target: 100 },
        { duration: '5s', target: 0 },
      ],
      exec: 'pollBadge',
    },
  },
  thresholds: {
    list_ok_duration: ['p(95)<800', 'p(99)<1500'],
    badge_ok_duration: ['p(95)<300'],
    server_errors: ['rate<0.01'], // < 1% 5xx
    rate_limited: ['rate>0'], // throttling must kick in under the spike
  },
};

// 429 is the expected answer once the limit is hit, not a failure.
http.setResponseCallback(http.expectedStatuses(200, 429));

const serverErrors = new Rate('server_errors');
const rateLimited = new Rate('rate_limited');
const listOk = new Trend('list_ok_duration', true);
const badgeOk = new Trend('badge_ok_duration', true);

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const params = {
  headers: { Authorization: `Bearer ${__ENV.TOKEN}` },
};

const FLOWS = ['', 'VENUE_SEAT', 'FIXED_TICKET', 'CLASS_SESSION'];
const STATUSES = ['', 'PAID', 'PENDING', 'EXPIRED'];
const SEARCHES = ['', '', 'customer1', 'load.test', 'Fixed Customer 99'];

const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

function record(res, trend) {
  serverErrors.add(res.status >= 500);
  rateLimited.add(res.status === 429);
  if (res.status === 200) trend.add(res.timings.duration);
  check(res, {
    'never 5xx': (r) => r.status < 500,
    'only 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
}

export function browseList() {
  const qs = [
    `page=${1 + Math.floor(Math.random() * 50)}`,
    `limit=${pick([20, 50, 100])}`,
  ];
  const flow = pick(FLOWS);
  const status = pick(STATUSES);
  const q = pick(SEARCHES);
  if (flow) qs.push(`flow=${flow}`);
  if (status) qs.push(`status=${status}`);
  if (q) qs.push(`q=${encodeURIComponent(q)}`);

  const res = http.get(`${BASE_URL}/api/v1/admin/payments?${qs.join('&')}`, {
    ...params,
    tags: { name: 'admin-payments-list' },
  });
  record(res, listOk);
}

export function pollBadge() {
  const since = Date.now() - 7 * 86_400_000;
  const res = http.get(
    `${BASE_URL}/api/v1/admin/payments/badge?since=${since}`,
    {
      ...params,
      tags: { name: 'admin-payments-badge' },
    },
  );
  record(res, badgeOk);
}
