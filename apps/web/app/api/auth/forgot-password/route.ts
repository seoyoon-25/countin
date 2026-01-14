import { NextResponse } from 'next/server';
import { prisma } from '@countin/database';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: parsed.error.issues[0].message },
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generate a new token
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save the token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // TODO: Send email with reset link
    // In production, integrate with email service (SendGrid, Resend, etc.)
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    // await sendEmail({
    //   to: email,
    //   subject: '[CountIn] 비밀번호 재설정',
    //   html: `<p>아래 링크를 클릭하여 비밀번호를 재설정해주세요:</p><a href="${resetUrl}">${resetUrl}</a>`,
    // });

    // For development, log the reset URL
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset URL: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/reset-password?token=${token}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: '요청 처리 중 오류가 발생했습니다' },
      },
      { status: 500 }
    );
  }
}
