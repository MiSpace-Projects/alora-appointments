import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm, type FamilyOption, type ServiceOption } from './BookingForm';

jest.mock('./actions', () => ({ createBookingAction: jest.fn() }));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn(), message: jest.fn() },
}));

const families: FamilyOption[] = [
  { slug: 'nail-art', title: 'Nail Art' },
  { slug: 'makeup', title: 'Makeup' },
];

const service = (id: string, familySlug: string, name: string): ServiceOption => ({
  id,
  familySlug,
  name,
  priceCents: 25000,
  priceType: 'FIXED',
  priceMaxCents: null,
  durationMinutes: 60,
  pointsAwarded: 25,
});

const services = [
  service('n1', 'nail-art', 'Gel-X Short'),
  service('n2', 'nail-art', 'Soak-off'),
  service('m1', 'makeup', 'Full Glam'),
];

const serviceNames = (): string[] =>
  within(screen.getByLabelText('Service'))
    .getAllByRole('option')
    .filter((option) => option.getAttribute('value'))
    .map((option) => option.textContent ?? '');

describe('BookingForm family-first selection', () => {
  it('lists no services until a service type is chosen', () => {
    render(<BookingForm families={families} services={services} onlinePaymentAvailable={false} />);
    expect(serviceNames()).toEqual([]);
  });

  it('only lists services from the chosen family', async () => {
    const user = userEvent.setup();
    render(<BookingForm families={families} services={services} onlinePaymentAvailable={false} />);

    await user.selectOptions(screen.getByLabelText('Service type'), 'nail-art');
    expect(serviceNames()).toEqual(['Gel-X Short · R250', 'Soak-off · R250']);

    await user.selectOptions(screen.getByLabelText('Service type'), 'makeup');
    expect(serviceNames()).toEqual(['Full Glam · R250']);
  });

  it('clears a chosen service when switching to another family', async () => {
    const user = userEvent.setup();
    render(<BookingForm families={families} services={services} onlinePaymentAvailable={false} />);

    await user.selectOptions(screen.getByLabelText('Service type'), 'nail-art');
    await user.selectOptions(screen.getByLabelText('Service'), 'n1');
    await user.selectOptions(screen.getByLabelText('Service type'), 'makeup');

    expect(screen.getByLabelText<HTMLSelectElement>('Service').value).toBe('');
  });

  it('opens on the family of a deep-linked service', () => {
    render(
      <BookingForm
        families={families}
        services={services}
        preselectedServiceId="m1"
        onlinePaymentAvailable={false}
      />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>('Service type').value).toBe('makeup');
    expect(screen.getByLabelText<HTMLSelectElement>('Service').value).toBe('m1');
  });
});

describe('BookingForm points', () => {
  const reviewWith = async (pointsBalance: number) => {
    const user = userEvent.setup();
    render(
      <BookingForm
        families={families}
        services={services}
        preselectedServiceId="n1"
        onlinePaymentAvailable={false}
        pointsBalance={pointsBalance}
      />,
    );
    await user.type(screen.getByLabelText(/Date & time/), '2030-03-04T10:00');
    await user.click(screen.getByRole('button', { name: 'Review booking' }));
    return user;
  };

  it('offers points in 100 steps up to half the price and lowers the total', async () => {
    const { createBookingAction } = jest.requireMock('./actions') as {
      createBookingAction: jest.Mock;
    };
    createBookingAction.mockResolvedValue({ ok: true, bookingId: 'b1' });
    const user = await reviewWith(450);

    const picker = screen.getByLabelText<HTMLSelectElement>('Use your points');
    expect(
      within(picker)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Don’t use points', '100 points · R50 off', '200 points · R100 off']);

    await user.selectOptions(picker, '200');
    expect(screen.getByText('R150')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));
    expect(createBookingAction).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: 'n1', redeemPoints: 200 }),
    );
  });

  it('hides the picker when there are not enough points', async () => {
    await reviewWith(99);
    expect(screen.queryByLabelText('Use your points')).not.toBeInTheDocument();
  });
});
