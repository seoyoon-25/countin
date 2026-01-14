import { NextResponse } from 'next/server';
import { prisma } from '@countin/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    // Find the token and check if it's valid
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false });
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false });
  }
}
