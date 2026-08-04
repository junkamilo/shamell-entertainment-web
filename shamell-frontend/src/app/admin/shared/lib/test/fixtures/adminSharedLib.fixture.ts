import {
  FIXTURE_ADMIN_TOKEN,
  FIXTURE_BACKEND_URL,
  FIXTURE_PRICE_INPUT,
  FIXTURE_PRICE_VALUE,
} from "./uuids.fixture";

export function makeAdminSharedToken(token = FIXTURE_ADMIN_TOKEN) {
  return token;
}

export function makeAdminSharedBackendUrl(url = FIXTURE_BACKEND_URL) {
  return url;
}

export function makePriceInputFixture(input = FIXTURE_PRICE_INPUT) {
  return input;
}

export function makePriceValueFixture(value = FIXTURE_PRICE_VALUE) {
  return value;
}
