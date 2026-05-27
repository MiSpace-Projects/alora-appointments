import { NextRequest, NextResponse } from 'next/server';
import { authClient } from '@/lib/auth-client';

interface AuthClientWithMethods {
  requestPasswordReset?: (params: { email: string; redirectTo: string }) => Promise<unknown>;
  resetPassword?: (params: { newPassword: string; token: string }) => Promise<unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const client = authClient as AuthClientWithMethods;
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`;

    try {
      if (client.requestPasswordReset) {
        await client.requestPasswordReset({
          email,
          redirectTo: redirectUrl,
        });
      } else {
        return NextResponse.json(
          { error: 'Password reset not configured. Please contact support.' },
          { status: 501 },
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      console.error('Better Auth reset error:', error);
      return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
