'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    // Verify token
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const result = await response.json();
        setIsValidToken(result.valid);
      } catch {
        setIsValidToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || '오류가 발생했습니다');
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError('비밀번호 재설정 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isValidToken === null) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-500">확인 중...</p>
        </CardContent>
      </Card>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <>
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
          <p className="text-slate-500">쉬운 회계의 시작</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">유효하지 않은 링크</CardTitle>
            <p className="text-slate-500 mt-2">
              이 비밀번호 재설정 링크는 만료되었거나 유효하지 않습니다.
              <br />
              새로운 재설정 링크를 요청해주세요.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/forgot-password">
              <Button className="w-full">새 링크 요청하기</Button>
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <>
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
          <p className="text-slate-500">쉬운 회계의 시작</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl">비밀번호가 변경되었습니다</CardTitle>
            <p className="text-slate-500 mt-2">
              새 비밀번호로 로그인할 수 있습니다.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full">로그인하기</Button>
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  // Reset password form
  return (
    <>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
        <p className="text-slate-500">쉬운 회계의 시작</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">새 비밀번호 설정</CardTitle>
          <p className="text-slate-500 mt-2">새로운 비밀번호를 입력해주세요.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                새 비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-slate-700"
              >
                새 비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-slate-500">로딩 중...</p>
          </CardContent>
        </Card>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
