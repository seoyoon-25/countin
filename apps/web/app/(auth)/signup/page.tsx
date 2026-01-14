'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

const signupSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create user
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      // Auto login after signup
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // User created but login failed, redirect to login
        router.push('/login');
      } else {
        // Go to onboarding
        router.push('/onboarding');
        router.refresh();
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-2xl font-bold text-primary-600">CountIn</h1>
        <p className="text-slate-500">쉬운 회계의 시작</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">회원가입</CardTitle>
          <p className="text-slate-500 mt-2">
            CountIn과 함께 쉬운 회계를 시작하세요
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
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                이름
              </label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                비밀번호
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
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                비밀번호 확인
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

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            가입 시{' '}
            <Link href="/terms" className="text-primary-600 hover:underline">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/terms/privacy" className="text-primary-600 hover:underline">
              개인정보처리방침
            </Link>
            에 동의합니다.
          </p>

          <div className="mt-6 text-center text-sm text-slate-500">
            이미 계정이 있으신가요?{' '}
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
