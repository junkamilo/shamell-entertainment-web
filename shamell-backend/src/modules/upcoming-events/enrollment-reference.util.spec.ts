import { formatEnrollmentReference } from './enrollment-reference.util';

describe('formatEnrollmentReference', () => {
  it('returns 8 uppercase chars from uuid', () => {
    const ref = formatEnrollmentReference('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    expect(ref).toHaveLength(8);
    expect(ref).toBe(ref.toUpperCase());
    expect(ref).toBe('A1B2C3D4');
  });
});
