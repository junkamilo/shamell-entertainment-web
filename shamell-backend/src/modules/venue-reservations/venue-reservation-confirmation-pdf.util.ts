import PDFDocument from 'pdfkit';
import { formatEventDateInZone } from '../../common/util/event-date-in-zone.util';

export type VenueReservationConfirmationPdfInput = {
  appPublicName: string;
  recipientName: string;
  reservationKindLabel: 'Table' | 'Chair';
  layoutItemLabel: string;
  eventDate: Date;
  reservationTimezone: string;
};

const GOLD = '#c9a227';
const TEXT = '#f5f5f5';
const MUTED = '#b8b8b8';
const PANEL = '#1a1a1a';
const PAGE_BG = '#0d0d0d';

export function buildVenueReservationConfirmationPdf(
  input: VenueReservationConfirmationPdfInput,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: {
        Title: `${input.appPublicName} — Reservation confirmation`,
        Author: input.appPublicName,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

    doc.rect(0, 0, pageWidth, doc.page.height).fill(PAGE_BG);

    let y = doc.page.margins.top;

    doc
      .fillColor(GOLD)
      .font('Helvetica-Bold')
      .fontSize(24)
      .text('SHAMELL', doc.page.margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y = doc.y + 8;

    doc
      .fillColor(GOLD)
      .font('Helvetica')
      .fontSize(10)
      .text(input.appPublicName.trim().toUpperCase(), doc.page.margins.left, y, {
        width: contentWidth,
        align: 'center',
        characterSpacing: 1.5,
      });
    y = doc.y + 28;

    doc
      .fillColor(TEXT)
      .font('Helvetica-Bold')
      .fontSize(20)
      .text('Your reservation is confirmed', doc.page.margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y = doc.y + 28;

    const recipientName = input.recipientName.trim() || 'Guest';
    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(12)
      .text(`Hi ${recipientName},`, doc.page.margins.left, y, {
        width: contentWidth,
      });
    y = doc.y + 14;

    const kindLower = input.reservationKindLabel.toLowerCase();
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(12)
      .text(
        `Your ${kindLower} reservation was successful. We have received your payment and your spot is now secured.`,
        doc.page.margins.left,
        y,
        { width: contentWidth, lineGap: 4 },
      );
    y = doc.y + 22;

    const panelX = doc.page.margins.left;
    const panelHeight = 118;
    doc.roundedRect(panelX, y, contentWidth, panelHeight, 12).fill(PANEL);

    const panelPadding = 18;
    const innerX = panelX + panelPadding;
    const innerWidth = contentWidth - panelPadding * 2;
    let panelY = y + panelPadding;

    doc
      .fillColor(TEXT)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`${input.reservationKindLabel} reserved`, innerX, panelY, {
        width: innerWidth,
      });
    panelY = doc.y + 6;

    doc
      .fillColor(TEXT)
      .font('Helvetica')
      .fontSize(15)
      .text(input.layoutItemLabel.trim() || 'Reserved item', innerX, panelY, {
        width: innerWidth,
      });
    panelY = doc.y + 12;

    const dateLine = formatEventDateInZone(
      input.eventDate,
      input.reservationTimezone,
    );
    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(12)
      .text(`Event date: ${dateLine}`, innerX, panelY, { width: innerWidth });

    y += panelHeight + 24;

    if (input.reservationKindLabel === 'Table') {
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(12)
        .text(
          'Please share the table number with your guests! Thank you!',
          doc.page.margins.left,
          y,
          { width: contentWidth, align: 'center', lineGap: 4 },
        );
      y = doc.y + 20;
    }

    doc
      .fillColor(MUTED)
      .font('Helvetica')
      .fontSize(10)
      .text(
        'If you did not request this reservation, please contact us using the information on our website.',
        doc.page.margins.left,
        y,
        { width: contentWidth, align: 'center', lineGap: 3 },
      );

    doc.end();
  });
}
