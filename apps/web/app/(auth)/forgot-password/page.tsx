'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || '오류가 발생했습니다');
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('요청 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
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
            <CardTitle className="text-2xl">이메일을 확인해주세요</CardTitle>
            <p className="text-slate-500 mt-2">
              비밀번호 재설정 링크가 포함된 이메일을 발송했습니다.
              <br />
              이메일을 확인해주세요.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                로그인으로 돌아가기
              </Button>
            </Link>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
        <p className="text-slate-500">쉬운 회계의 시작</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
          <p className="text-slate-500 mt-2">
            가입하신 이메일 주소를 입력하시면
            <br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '전송 중...' : '재설정 링크 받기'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            비밀번호가 기억나셨나요?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
