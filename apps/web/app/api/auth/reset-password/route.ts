import { NextResponse } from 'next/server';
import { prisma } from '@countin/database';
import { hash } from 'bcryptjs';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { message: parsed.error.issues[0].message },
        },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Find the token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '유효하지 않은 토큰입니다' },
        },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { token },
      });
      return NextResponse.json(
        {
          success: false,
          error: { message: '토큰이 만료되었습니다' },
        },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '사용자를 찾을 수 없습니다' },
        },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { message: '비밀번호 재설정 중 오류가 발생했습니다' },
      },
      { status: 500 }
    );
  }
}
