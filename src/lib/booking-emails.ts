import { businessContact, cancellationPolicy } from '@/app/config/business';
import { googleCalendarUrl, icsEvent, type CalendarEvent } from './calendar';
import { formatDuration } from './format';

export interface BookingEmailContext {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  serviceSlug: string;
  startsAt: Date;
  durationMinutes: number;
  price: string;
  paymentMethod: 'PAY_NOW' | 'PAY_IN_SALON';
  paid: boolean;
  notes: string | null;
}

export interface BookingEmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface BookingEmail {
  subject: string;
  html: string;
  text: string;
  attachments?: BookingEmailAttachment[];
}

const INK = '#0e0c0b';
const CREAM = '#ede6dc';
const SAND = '#d4c5b0';
const BROWN = '#5e493c';
const TEXT = '#1a1714';
const MUTED = '#6b625a';
const LINE = '#e8e1d7';
const PAGE = '#efe9e1';
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const LOCATION = `Alora Studios, ${businessContact.location}`;

const sastDay = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  weekday: 'long',
});
const sastDate = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const sastTime = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return replacements[character] ?? character;
  });
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? businessContact.website).replace(/\/$/, '');
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || 'there';
}

function endsAt(context: BookingEmailContext): Date {
  return new Date(context.startsAt.getTime() + context.durationMinutes * 60_000);
}

function reference(bookingId: string): string {
  return bookingId.slice(-6).toUpperCase();
}

function when(context: BookingEmailContext) {
  return {
    day: sastDay.format(context.startsAt),
    date: sastDate.format(context.startsAt),
    start: sastTime.format(context.startsAt),
    end: sastTime.format(endsAt(context)),
  };
}

function paymentLine(context: BookingEmailContext): string {
  if (context.paid) return 'Paid online';
  return context.paymentMethod === 'PAY_NOW'
    ? 'Pay online to secure your slot'
    : 'Pay at the salon';
}

function calendarEvent(context: BookingEmailContext, title: string): CalendarEvent {
  return {
    uid: `${context.bookingId}@alorastudios.co.za`,
    title,
    start: context.startsAt,
    end: endsAt(context),
    details: `${context.serviceName} at Alora Studios. Reference ${reference(context.bookingId)}. Manage your booking at ${siteUrl()}/profile`,
    location: LOCATION,
  };
}

function button(href: string, label: string, variant: 'dark' | 'sand' = 'dark'): string {
  const background = variant === 'dark' ? INK : SAND;
  const color = variant === 'dark' ? CREAM : INK;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td bgcolor="${background}" style="border-radius:999px;background:${background};"><a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:${color};text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a></td></tr></table>`;
}

function hero(options: {
  kicker: string;
  title: string;
  lead: string;
  imageUrl?: string;
  imageAlt?: string;
}): string {
  const image = options.imageUrl
    ? `<td width="220" valign="bottom" class="hero-image" style="padding:0;width:220px;"><img src="${escapeHtml(options.imageUrl)}" width="220" height="324" alt="${escapeHtml(options.imageAlt ?? '')}" class="hero-photo" style="display:block;width:220px;height:324px;border:0;"></td>`
    : '';
  return `<tr><td bgcolor="${INK}" style="background:${INK};padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td valign="middle" class="hero-text" style="padding:40px 28px 40px 40px;"><p style="margin:0 0 14px;font-family:${FONT};font-size:13px;font-weight:600;color:${SAND};">${escapeHtml(options.kicker)}</p><h1 class="hero-title" style="margin:0 0 16px;font-family:${FONT};font-size:34px;line-height:1.12;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${escapeHtml(options.title)}</h1><p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.55;color:${CREAM};opacity:0.85;">${escapeHtml(options.lead)}</p></td>${image}</tr></table></td></tr>`;
}

function dateBlock(context: BookingEmailContext): string {
  const time = when(context);
  return `<tr><td style="padding:36px 40px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-left:4px solid ${SAND};padding:4px 0 4px 20px;"><p style="margin:0;font-family:${FONT};font-size:14px;font-weight:600;color:${BROWN};">${escapeHtml(time.day)}</p><p style="margin:4px 0 6px;font-family:${FONT};font-size:30px;line-height:1.15;font-weight:700;color:${TEXT};letter-spacing:-0.4px;">${escapeHtml(time.date)}</p><p style="margin:0;font-family:${FONT};font-size:17px;color:${TEXT};">${escapeHtml(time.start)} to ${escapeHtml(time.end)} <span style="color:${MUTED};">(South African time)</span></p></td></tr></table></td></tr>`;
}

function detailRows(rows: [string, string][]): string {
  const body = rows
    .map(
      ([label, value], index) =>
        `<tr><td style="padding:13px 0;${index ? `border-top:1px solid ${LINE};` : ''}font-family:${FONT};font-size:14px;color:${MUTED};width:38%;" valign="top">${escapeHtml(label)}</td><td style="padding:13px 0;${index ? `border-top:1px solid ${LINE};` : ''}font-family:${FONT};font-size:15px;font-weight:600;color:${TEXT};" valign="top">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  return `<tr><td style="padding:24px 40px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">${body}</table></td></tr>`;
}

function callout(title: string, body: string): string {
  return `<tr><td style="padding:24px 40px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#f7f1e8" style="background:#f7f1e8;border-radius:14px;padding:18px 22px;"><p style="margin:0 0 6px;font-family:${FONT};font-size:13px;font-weight:700;color:${BROWN};">${escapeHtml(title)}</p><p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.5;color:${TEXT};">${escapeHtml(body)}</p></td></tr></table></td></tr>`;
}

function paragraph(html: string, padding = '24px 40px 0'): string {
  return `<tr><td style="padding:${padding};font-family:${FONT};font-size:15px;line-height:1.6;color:${TEXT};">${html}</td></tr>`;
}

function actions(primary: string, secondary?: string): string {
  return `<tr><td style="padding:30px 40px 0;">${primary}${secondary ? `<p style="margin:16px 0 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED};">${secondary}</p>` : ''}</td></tr>`;
}

function link(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" style="color:${BROWN};font-weight:700;text-decoration:underline;">${escapeHtml(label)}</a>`;
}

function layout(preheader: string, rows: string, footerNote: string): string {
  const logo = `${siteUrl()}/email/alora-logo.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Alora Studios</title><style>@media only screen and (max-width:480px){.hero-text{padding:30px 14px 30px 24px!important}.hero-title{font-size:26px!important;line-height:1.15!important}.hero-image{width:132px!important}.hero-photo{width:132px!important;height:194px!important}}</style></head><body style="margin:0;padding:0;background:${PAGE};"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAGE}" style="background:${PAGE};"><tr><td align="center" style="padding:32px 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;"><tr><td bgcolor="${INK}" style="background:${INK};padding:26px 40px 6px;"><a href="${siteUrl()}" target="_blank"><img src="${logo}" height="52" alt="Alora Studios" style="display:block;height:52px;width:auto;border:0;"></a></td></tr>${rows}<tr><td style="padding:40px 40px 34px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${LINE};"><tr><td style="padding-top:22px;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};"><strong style="color:${TEXT};">Alora Studios</strong> · ${escapeHtml(businessContact.location)}<br>${link(`mailto:${businessContact.email}`, businessContact.email)} · ${link(`tel:${businessContact.phoneE164}`, businessContact.phoneDisplay)}<br><span style="font-size:12px;">${escapeHtml(footerNote)}</span></td></tr></table></td></tr></table></td></tr></table></body></html>`;
}

function calendarAttachment(context: BookingEmailContext, title: string): BookingEmailAttachment {
  return {
    filename: 'alora-booking.ics',
    content: Buffer.from(icsEvent(calendarEvent(context, title)), 'utf8'),
    contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
  };
}

function policyLine(): string {
  const late = Math.round(cancellationPolicy.lateRefundFraction * 100);
  return `Plans changed? Cancel ${cancellationPolicy.fullRefundHours} hours or more before your visit for a full refund of anything paid online. Inside ${cancellationPolicy.fullRefundHours} hours, ${late}% is refunded.`;
}

function customerBookingEmail(
  context: BookingEmailContext,
  copy: { subject: string; kicker: string; title: string; lead: string; preheader: string },
): BookingEmail {
  const time = when(context);
  const title = `${context.serviceName} at Alora Studios`;
  const calendarUrl = googleCalendarUrl(calendarEvent(context, title));
  const imageUrl = `${siteUrl()}/email/services/${context.serviceSlug}.jpg`;
  const rows: [string, string][] = [
    ['Service', context.serviceName],
    ['Duration', formatDuration(context.durationMinutes)],
    ['Price', context.price],
    ['Payment', paymentLine(context)],
    ['Where', LOCATION],
    ['Reference', reference(context.bookingId)],
  ];
  const html = layout(
    copy.preheader,
    [
      hero({
        kicker: copy.kicker,
        title: copy.title,
        lead: copy.lead,
        imageUrl,
        imageAlt: context.serviceName,
      }),
      dateBlock(context),
      detailRows(rows),
      context.notes ? callout('Your note to us', context.notes) : '',
      actions(
        button(calendarUrl, 'Add to Google Calendar'),
        `Using Apple Calendar or Outlook? Open the attached <strong>alora-booking.ics</strong> to save it. Need to make a change? ${link(`${siteUrl()}/profile`, 'Manage your booking')}.`,
      ),
      paragraph(escapeHtml(policyLine()), '28px 40px 0'),
    ].join(''),
    `You are receiving this because you booked at ${siteUrl().replace(/^https?:\/\//, '')}.`,
  );
  const text = [
    copy.title,
    '',
    copy.lead,
    '',
    `${time.day}, ${time.date}`,
    `${time.start} to ${time.end} (South African time)`,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    ...(context.notes ? ['', `Your note to us: ${context.notes}`] : []),
    '',
    `Add to Google Calendar: ${calendarUrl}`,
    'Apple Calendar or Outlook: open the attached alora-booking.ics.',
    `Manage your booking: ${siteUrl()}/profile`,
    '',
    policyLine(),
    '',
    `Alora Studios, ${businessContact.location}`,
    `${businessContact.email} · ${businessContact.phoneDisplay}`,
  ].join('\n');
  return {
    subject: copy.subject,
    html,
    text,
    attachments: [calendarAttachment(context, title)],
  };
}

export function bookingReceivedCustomerEmail(context: BookingEmailContext): BookingEmail {
  const name = firstName(context.customerName);
  const time = when(context);
  const awaitingPayment = context.paymentMethod === 'PAY_NOW' && !context.paid;
  return customerBookingEmail(context, {
    subject: `You're on the books: ${context.serviceName}, ${time.day} ${time.start}`,
    kicker: 'Booking received',
    title: `You're on the books, ${name}.`,
    lead: awaitingPayment
      ? `Your ${context.serviceName} is held for you. Complete your payment to lock it in.`
      : `Your ${context.serviceName} request is in. We'll confirm it by email shortly.`,
    preheader: `${context.serviceName} on ${time.day} ${time.date} at ${time.start}. Add it to your calendar.`,
  });
}

export function bookingConfirmedCustomerEmail(context: BookingEmailContext): BookingEmail {
  const name = firstName(context.customerName);
  const time = when(context);
  return customerBookingEmail(context, {
    subject: `Confirmed: ${context.serviceName}, ${time.day} ${time.date} at ${time.start}`,
    kicker: 'Booking confirmed',
    title: `It's official, ${name}.`,
    lead: `Your ${context.serviceName} is confirmed. We can't wait to see you.`,
    preheader: `See you on ${time.day} ${time.date} at ${time.start}. Add it to your calendar.`,
  });
}

export function bookingCancelledCustomerEmail(
  context: BookingEmailContext,
  details: { cancelledBy: 'customer' | 'salon'; refund: string | null },
): BookingEmail {
  const name = firstName(context.customerName);
  const time = when(context);
  const lead =
    details.cancelledBy === 'salon'
      ? `We had to cancel your ${context.serviceName}. We'd love to find you a new time.`
      : `Your ${context.serviceName} has been cancelled as you asked.`;
  const refund = details.refund
    ? `A refund of ${details.refund} is on its way to the card you paid with. Banks can take up to ${cancellationPolicy.refundProcessingDays} working days to show it.`
    : 'No online payment was taken, so there is nothing to refund.';
  const rows: [string, string][] = [
    ['Service', context.serviceName],
    ['Was booked for', `${time.day}, ${time.date} at ${time.start}`],
    ['Reference', reference(context.bookingId)],
  ];
  const html = layout(
    `Your ${context.serviceName} on ${time.date} is cancelled.`,
    [
      hero({
        kicker: 'Booking cancelled',
        title: details.cancelledBy === 'salon' ? `We're sorry, ${name}.` : `All sorted, ${name}.`,
        lead,
      }),
      detailRows(rows),
      callout('Refund', refund),
      actions(
        button(`${siteUrl()}/book`, 'Book a new time'),
        `Questions? Email ${link(`mailto:${businessContact.email}`, businessContact.email)}.`,
      ),
    ].join(''),
    `You are receiving this because you booked at ${siteUrl().replace(/^https?:\/\//, '')}.`,
  );
  const text = [
    `Hi ${name},`,
    '',
    lead,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    refund,
    '',
    `Book a new time: ${siteUrl()}/book`,
  ].join('\n');
  return { subject: `Cancelled: ${context.serviceName}, ${time.date}`, html, text };
}

export function newBookingOwnerEmail(context: BookingEmailContext): BookingEmail {
  const time = when(context);
  const dashboard = `${siteUrl()}/owner`;
  const calendarUrl = googleCalendarUrl(
    calendarEvent(context, `${context.serviceName} with ${context.customerName}`),
  );
  const rows: [string, string][] = [
    ['Customer', context.customerName],
    ['Email', context.customerEmail],
    ['Service', context.serviceName],
    ['Duration', formatDuration(context.durationMinutes)],
    ['Price', context.price],
    ['Payment', paymentLine(context)],
    ['Reference', reference(context.bookingId)],
  ];
  const html = layout(
    `${context.customerName} booked ${context.serviceName} for ${time.day} ${time.date} at ${time.start}.`,
    [
      hero({
        kicker: 'New booking request',
        title: `${firstName(context.customerName)} wants ${context.serviceName}.`,
        lead: `${time.day}, ${time.date} at ${time.start}. It is waiting for your confirmation.`,
        imageUrl: `${siteUrl()}/email/services/${context.serviceSlug}.jpg`,
        imageAlt: context.serviceName,
      }),
      dateBlock(context),
      context.notes ? callout('Customer note', context.notes) : '',
      detailRows(rows),
      actions(
        button(dashboard, 'Open bookings dashboard', 'sand'),
        `Confirm or manage it from the dashboard. ${link(calendarUrl, 'Add it to Google Calendar')} · ${link(`mailto:${context.customerEmail}`, `Email ${firstName(context.customerName)}`)}`,
      ),
    ].join(''),
    'You are receiving this because you are an owner on the Alora bookings dashboard.',
  );
  const text = [
    `New booking request: ${context.customerName} wants ${context.serviceName}.`,
    '',
    `${time.day}, ${time.date}, ${time.start} to ${time.end} (South African time)`,
    ...(context.notes ? ['', `Customer note: ${context.notes}`] : []),
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    `Open the bookings dashboard: ${dashboard}`,
    `Add to Google Calendar: ${calendarUrl}`,
  ].join('\n');
  return {
    subject: `New booking: ${context.serviceName}, ${time.day} ${time.date} at ${time.start}`,
    html,
    text,
  };
}
