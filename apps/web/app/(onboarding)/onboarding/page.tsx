'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@countin/ui';
import { cn } from '@countin/utils';

const organizationTypes = [
  {
    value: 'NONPROFIT',
    label: '비영리법인',
    description: '사단법인, 재단법인, 비영리민간단체 등',
    icon: '🏛️',
  },
  {
    value: 'FORPROFIT',
    label: '영리법인',
    description: '주식회사, 유한회사, 스타트업 등',
    icon: '🏢',
  },
  {
    value: 'SOLE_PROPRIETOR',
    label: '개인사업자',
    description: '1인 사업자, 프리랜서 등',
    icon: '👤',
  },
  {
    value: 'SOCIAL_ENTERPRISE',
    label: '사회적기업',
    description: '사회적기업, 협동조합, 마을기업 등',
    icon: '🤝',
  },
];

const onboardingSchema = z.object({
  name: z.string().min(2, '조직명은 2자 이상이어야 합니다'),
  type: z.enum(['NONPROFIT', 'FORPROFIT', 'SOLE_PROPRIETOR', 'SOCIAL_ENTERPRISE']),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
  });

  const selectedType = watch('type');

  const onSubmit = async (data: OnboardingForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      // Update session to include new tenant
      await update();

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('조직 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {step === 1 ? '조직 유형을 선택해주세요' : '조직 정보를 입력해주세요'}
        </CardTitle>
        <p className="text-slate-500 mt-2">
          {step === 1
            ? '조직 유형에 따라 맞춤 계정과목이 자동 설정됩니다'
            : '조직명을 입력하면 설정이 완료됩니다'}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {organizationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setValue('type', type.value as OnboardingForm['type']);
                    }}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      selectedType === type.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <span className="text-3xl mb-2 block">{type.icon}</span>
                    <h3 className="font-semibold text-slate-900">{type.label}</h3>
                    <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-500">조직 유형을 선택해주세요</p>
              )}

              <Button
                type="button"
                className="w-full mt-6"
                disabled={!selectedType}
                onClick={() => setStep(2)}
              >
                다음
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 flex items-center gap-3">
                  <span className="text-2xl">
                    {organizationTypes.find((t) => t.value === selectedType)?.icon}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      {organizationTypes.find((t) => t.value === selectedType)?.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      변경하기
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700">
                    조직명
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="예: 유니피벗"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  이전
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? '생성 중...' : '조직 생성'}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
