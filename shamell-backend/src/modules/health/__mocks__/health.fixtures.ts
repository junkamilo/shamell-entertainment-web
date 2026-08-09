import {
  HEALTH_DB_CONNECTED,
  HEALTH_SERVICE_NAME,
} from '../constants/health.constants';

export function makeLivenessResponse() {
  return { ok: true as const, service: HEALTH_SERVICE_NAME };
}

export function makeReadinessResponse() {
  return { ok: true as const, db: HEALTH_DB_CONNECTED };
}
