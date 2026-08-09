import { makeCreateContactDto } from '../__mocks__/contact.fixtures';
import { contactInquiryDetailLines } from './contact-inquiry-lines.util';

describe('contact-inquiry-lines.util', () => {
  it('builds phone / date / location / message lines', () => {
    expect(
      contactInquiryDetailLines(
        makeCreateContactDto({
          phone: '555',
          eventDate: '2026-09-01',
          location: 'Miami',
          message: 'Hello world',
        }),
      ),
    ).toEqual([
      'Phone: 555',
      'Event date: 2026-09-01',
      'Location: Miami',
      'Message: Hello world',
    ]);
  });

  it('truncates long messages', () => {
    const message = 'x'.repeat(300);
    const lines = contactInquiryDetailLines(
      makeCreateContactDto({ phone: undefined, message }),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^Message: x{277}…$/);
  });
});
