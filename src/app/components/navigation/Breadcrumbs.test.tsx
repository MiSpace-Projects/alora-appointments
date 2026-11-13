import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

function currentLabel(pathname: string): string | null {
  const { unmount } = render(<Breadcrumbs pathname={pathname} />);
  const label = screen.getByText(
    (_, element) => element?.getAttribute('aria-current') === 'page',
  ).textContent;
  unmount();
  return label;
}

describe('Breadcrumbs', () => {
  it.each([
    ['/paia-manual', 'PAIA Manual'],
    ['/privacy-policy', 'Privacy Policy'],
    ['/cookie-policy', 'Cookie Policy'],
    ['/terms', 'Terms & Booking Policy'],
    ['/services', 'Services'],
    ['/services/nail-art', 'Nail Art'],
    ['/login', 'Welcome Back'],
  ])('labels %s as %s', (pathname, label) => {
    expect(currentLabel(pathname)).toBe(label);
  });

  it('title cases segments without an explicit label', () => {
    expect(currentLabel('/some-new-page')).toBe('Some New Page');
  });
});
