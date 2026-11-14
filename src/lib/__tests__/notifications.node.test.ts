const sendAuthEmail = jest.fn().mockResolvedValue(true);

jest.mock('@/lib/email', () => ({
  ...jest.requireActual('@/lib/email'),
  sendAuthEmail: (...args: unknown[]) => sendAuthEmail(...args),
}));

const details = {
  customerName: 'Customer',
  customerEmail: 'customer@example.com',
  serviceName: 'Gel X',
  when: '05 Dec 2026, 10:00',
  price: 'R350',
  paymentMethod: 'Pay at the salon',
};

describe('notifyOwnerOfNewBooking', () => {
  const original = process.env.ALORA_OWNER_EMAILS;

  afterEach(() => {
    process.env.ALORA_OWNER_EMAILS = original;
    sendAuthEmail.mockClear();
  });

  it('emails every owner on the allowlist', async () => {
    process.env.ALORA_OWNER_EMAILS = 'Owner@Example.com, second@example.com';
    const { notifyOwnerOfNewBooking } = await import('@/lib/notifications');
    await notifyOwnerOfNewBooking(details);
    expect(sendAuthEmail.mock.calls.map(([input]) => input.to)).toEqual([
      'owner@example.com',
      'second@example.com',
    ]);
    expect(sendAuthEmail.mock.calls[0][0].kind).toBe('BOOKING_CREATED_OWNER');
  });

  it('sends nothing when no owner is configured', async () => {
    process.env.ALORA_OWNER_EMAILS = '';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { notifyOwnerOfNewBooking } = await import('@/lib/notifications');
    await notifyOwnerOfNewBooking(details);
    expect(sendAuthEmail).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
