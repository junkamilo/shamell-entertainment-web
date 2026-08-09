/**
 * Shared Nest/Jest testing helpers for module unit specs.
 * Prefer `useValue` mocks + fixtures over hitting real Cloudinary/DB in unit tests.
 */

export { createPrismaMock, type PrismaMock } from './prisma-mock';
export { compileTestingModule } from './nest-testing.util';
