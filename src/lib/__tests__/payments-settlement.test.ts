/**
 * Settlement state machine: the callback page and the webhook both call
 * settlePaymentByReference, possibly concurrently and more than once. These
 * tests pin the exactly-once confirmation and the amount/currency guard with
 * Prisma and the provider mocked.
 */
const updateMany = jest.fn();
const bookingUpdateMany = jest.fn();
const findUnique = jest.fn();
const verifyTransaction = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    payment: { findUnique: (...args: unknown[]) => findUnique(...args), updateMany },
    booking: { updateMany: bookingUpdateMany },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        payment: { updateMany },
        booking: { updateMany: bookingUpdateMany },
      }),
  },
}));

jest.mock('@/lib/payments/paystack', () => ({
  ...jest.requireActual('@/lib/payments/paystack'),
  verifyTransaction: (...args: unknown[]) => verifyTransaction(...args),
  initializeTransaction: jest.fn(),
  refundTransaction: jest.fn(),
}));

const pendingPayment = {
  id: 'pay_1',
  bookingId: 'bk_1',
  reference: 'alora_bk_1_x',
  amountCents: 45000,
  status: 'PENDING',
  refundedCents: 0,
};

describe('settlePaymentByReference', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('confirms the booking exactly once on a verified, amount-matching success', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue(pendingPayment);
    verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: pendingPayment.reference,
      amount: 45000,
      currency: 'ZAR',
      channel: 'card',
      paid_at: '2026-10-01T10:00:00.000Z',
    });
    updateMany.mockResolvedValueOnce({ count: 1 });

    await expect(settlePaymentByReference(pendingPayment.reference)).resolves.toBe('PAID');
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pay_1', status: 'PENDING' } }),
    );
    expect(bookingUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED', paymentMethod: 'PAY_NOW' }),
      }),
    );
  });

  it('greets a just-completed payment as PAID on the return page', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue({ ...pendingPayment, status: 'SUCCESS', paidAt: new Date() });

    await expect(settlePaymentByReference(pendingPayment.reference)).resolves.toBe('PAID');
    expect(verifyTransaction).not.toHaveBeenCalled();
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it('is idempotent: a second delivery after success changes nothing', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue({ ...pendingPayment, status: 'SUCCESS' });

    await expect(settlePaymentByReference(pendingPayment.reference)).resolves.toBe('ALREADY_PAID');
    expect(verifyTransaction).not.toHaveBeenCalled();
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it('never confirms a booking when the verified amount or currency differs', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue(pendingPayment);
    verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: pendingPayment.reference,
      amount: 100,
      currency: 'ZAR',
    });
    updateMany.mockResolvedValue({ count: 1 });

    await expect(settlePaymentByReference(pendingPayment.reference)).resolves.toBe('FAILED');
    expect(bookingUpdateMany).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });

  it('loses the race gracefully when the other path already confirmed', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue(pendingPayment);
    verifyTransaction.mockResolvedValue({
      status: 'success',
      reference: pendingPayment.reference,
      amount: 45000,
      currency: 'ZAR',
    });
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(settlePaymentByReference(pendingPayment.reference)).resolves.toBe('ALREADY_PAID');
    expect(bookingUpdateMany).not.toHaveBeenCalled();
  });

  it('ignores references it does not know', async () => {
    const { settlePaymentByReference } = await import('@/lib/data/payments');
    findUnique.mockResolvedValue(null);
    await expect(settlePaymentByReference('nope')).resolves.toBe('UNKNOWN_REFERENCE');
    expect(verifyTransaction).not.toHaveBeenCalled();
  });
});
