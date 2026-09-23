import { renderToStaticMarkup } from 'react-dom/server';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedLink } from './ProtectedLink';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);

function renderLink(): HTMLAnchorElement {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(<ProtectedLink href="/book">Book Now</ProtectedLink>);
  const link = container.querySelector('a');
  if (!link) throw new Error('ProtectedLink did not render an anchor.');
  return link;
}

describe('ProtectedLink', () => {
  it('uses a full login destination for a signed-out user', () => {
    mockedUseAuth.mockReturnValue({ user: null } as ReturnType<typeof useAuth>);

    expect(renderLink()).toHaveAttribute('href', '/login?callbackUrl=%2Fbook');
  });

  it('links directly to the protected destination for a signed-in user', () => {
    mockedUseAuth.mockReturnValue({ user: { id: 'user-1' } } as ReturnType<typeof useAuth>);

    expect(renderLink()).toHaveAttribute('href', '/book');
  });
});
