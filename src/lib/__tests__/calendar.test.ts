import { googleCalendarUrl, icsEvent, type CalendarEvent } from '@/lib/calendar';

const event: CalendarEvent = {
  uid: 'bk_123@alorastudios.co.za',
  title: 'Advanced Customization at Alora Studios',
  start: new Date('2026-12-03T08:00:00.000Z'),
  end: new Date('2026-12-03T10:00:00.000Z'),
  details: 'Booking reference BK123, pay at the salon.\nSee you soon',
  location: 'Alora Studios, Bethlehem, Free State',
};

describe('googleCalendarUrl', () => {
  it('builds a Google Calendar template link in UTC with the SAST zone', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toBe('20261203T080000Z/20261203T100000Z');
    expect(url.searchParams.get('text')).toBe(event.title);
    expect(url.searchParams.get('location')).toBe(event.location);
    expect(url.searchParams.get('ctz')).toBe('Africa/Johannesburg');
  });
});

describe('icsEvent', () => {
  const ics = icsEvent(event, new Date('2026-11-14T12:00:00.000Z'));

  it('produces a valid single event with CRLF line endings and a reminder', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('\r\nDTSTART:20261203T080000Z\r\n');
    expect(ics).toContain('\r\nDTEND:20261203T100000Z\r\n');
    expect(ics).toContain('\r\nUID:bk_123@alorastudios.co.za\r\n');
    expect(ics).toContain('TRIGGER:-PT2H');
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('escapes commas, semicolons and new lines in text fields', () => {
    expect(ics).toContain('LOCATION:Alora Studios\\, Bethlehem\\, Free State');
    expect(ics).toContain('BK123\\, pay at the salon.\\nSee you soon');
  });

  it('folds lines longer than 75 characters', () => {
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
  });
});
