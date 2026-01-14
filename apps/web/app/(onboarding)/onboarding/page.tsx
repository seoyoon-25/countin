'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button, Input, Card, CardContent } from '@countin/ui';
import { cn } from '@countin/utils';

// Organization types
const organizationTypes = [
  {
    value: 'NONPROFIT',
    label: '비영리법인',
    description: '사단법인, 재단법인, 비영리민간단체, NGO 등',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    bg: 'bg-rose-50',
  },
  {
    value: 'FORPROFIT',
    label: '영리법인',
    description: '주식회사, 유한회사, 스타트업, 1인 법인 등',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
  },
  {
    value: 'SOLE_PROPRIETOR',
    label: '개인사업자',
    description: '1인 사업자, 프리랜서, 소상공인, 크리에이터 등',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    color: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    value: 'SOCIAL_ENTERPRISE',
    label: '사회적기업',
    description: '사회적기업, 협동조합, 마을기업, 소셜벤처 등',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
];

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Step indicator
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div key={index} className="flex items-center">
          <motion.div
            initial={false}
            animate={{
              scale: currentStep === index + 1 ? 1.2 : 1,
              backgroundColor: currentStep >= index + 1 ? '#6366f1' : '#e2e8f0',
            }}
            className={cn(
              'w-3 h-3 rounded-full transition-colors',
              currentStep >= index + 1 ? 'bg-indigo-500' : 'bg-slate-200'
            )}
          />
          {index < totalSteps - 1 && (
            <motion.div
              initial={false}
              animate={{
                backgroundColor: currentStep > index + 1 ? '#6366f1' : '#e2e8f0',
              }}
              className="w-12 h-0.5 mx-1"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [createdTenant, setCreatedTenant] = useState<{ name: string; slug: string } | null>(null);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (!slugEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugEdited]);

  // Fire confetti
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Handle step 1 next
  const handleStep1Next = () => {
    if (selectedType) {
      setStep(2);
    }
  };

  // Handle step 2 submit
  const handleStep2Submit = async () => {
    if (!selectedType || !name.trim() || !slug.trim()) {
      setError('모든 필드를 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType,
          slug: slug.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      // Update session
      await update();

      // Set created tenant and move to step 3
      setCreatedTenant({ name: result.data.name, slug: result.data.slug });
      setStep(3);

      // Fire confetti
      setTimeout(fireConfetti, 300);
    } catch (err) {
      setError('조직 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle go to dashboard
  const handleGoToDashboard = () => {
    router.push('/dashboard');
    router.refresh();
  };

  const selectedTypeData = organizationTypes.find((t) => t.value === selectedType);

  return (
    <div className="space-y-8">
      {/* Step indicator */}
      <StepIndicator currentStep={step} totalSteps={3} />

      {/* Content */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    조직 유형을 선택해주세요
                  </h2>
                  <p className="text-slate-500 mt-2">
                    조직 유형에 따라 맞춤 계정과목이 자동 설정됩니다
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organizationTypes.map((type, index) => (
                    <motion.button
                      key={type.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.value)}
                      className={cn(
                        'relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden group',
                        selectedType === type.value
                          ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      )}
                    >
                      {/* Background gradient on hover/select */}
                      <div
                        className={cn(
                          'absolute inset-0 opacity-0 transition-opacity',
                          selectedType === type.value ? 'opacity-5' : 'group-hover:opacity-5'
                        )}
                        style={{
                          background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                        }}
                      />

                      {/* Check mark */}
                      {selectedType === type.value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-4 right-4 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 bg-gradient-to-br',
                        type.gradient
                      )}>
                        {type.icon}
                      </div>

                      {/* Content */}
                      <h3 className="text-lg font-bold text-slate-900">{type.label}</h3>
                      <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={handleStep1Next}
                  disabled={!selectedType}
                  className="w-full mt-8 py-6 text-lg bg-gradient-to-r from-indigo-600 to-indigo-500"
                >
                  다음
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="pt-8 pb-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-900">
                    조직 정보를 입력해주세요
                  </h2>
                  <p className="text-slate-500 mt-2">
                    조직명과 URL 주소를 설정합니다
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Selected type display */}
                {selectedTypeData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('p-4 rounded-xl flex items-center gap-4 mb-6', selectedTypeData.bg)}
                  >
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br', selectedTypeData.gradient)}>
                      {selectedTypeData.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{selectedTypeData.label}</p>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        변경하기
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Form */}
                <div className="space-y-6">
                  {/* Organization name */}
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-slate-700">
                      조직명 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="예: 유니피벗"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="py-3"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label htmlFor="slug" className="text-sm font-medium text-slate-700">
                      URL 주소 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">countin.kr/</span>
                      <Input
                        id="slug"
                        type="text"
                        placeholder="my-org"
                        value={slug}
                        onChange={(e) => {
                          setSlug(e.target.value);
                          setSlugEdited(true);
                        }}
                        className="flex-1 py-3"
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      영문 소문자, 숫자, 하이픈(-)만 사용 가능합니다
                    </p>
                  </div>

                  {/* Logo upload (optional) */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      로고 <span className="text-slate-400">(선택)</span>
                    </label>
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-slate-300 transition-colors cursor-pointer">
                      <svg className="w-10 h-10 mx-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-slate-500">
                        클릭하여 로고를 업로드하세요
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        PNG, JPG (최대 2MB)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 py-6"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    이전
                  </Button>
                  <Button
                    onClick={handleStep2Submit}
                    disabled={isLoading || !name.trim() || !slug.trim()}
                    className="flex-1 py-6 bg-gradient-to-r from-indigo-600 to-indigo-500"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        생성 중...
                      </>
                    ) : (
                      <>
                        조직 생성
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && createdTenant && (
          <motion.div
            key="step3"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="text-center">
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                  >
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>

                  {/* Title */}
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-8 text-3xl font-bold text-slate-900"
                  >
                    설정 완료!
                  </motion.h2>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 text-lg text-slate-600"
                  >
                    <span className="font-semibold text-indigo-600">{createdTenant.name}</span>
                    {' '}조직이 성공적으로 생성되었습니다.
                  </motion.p>

                  {/* Features list */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-8 p-6 bg-slate-50 rounded-2xl text-left max-w-md mx-auto"
                  >
                    <p className="text-sm font-semibold text-slate-700 mb-4">
                      다음 단계로 진행해보세요:
                    </p>
                    <ul className="space-y-3">
                      {[
                        '첫 번째 거래를 등록해보세요',
                        '프로젝트를 생성하고 예산을 관리하세요',
                        '팀원을 초대하여 함께 사용하세요',
                      ].map((item, index) => (
                        <motion.li
                          key={item}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center gap-3 text-sm text-slate-600"
                        >
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mt-8"
                  >
                    <Button
                      onClick={handleGoToDashboard}
                      size="lg"
                      className="px-12 py-6 text-lg bg-gradient-to-r from-indigo-600 to-indigo-500"
                    >
                      대시보드로 이동
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Button>
                  </motion.div>

                  {/* URL info */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 text-sm text-slate-400"
                  >
                    조직 URL: countin.kr/{createdTenant.slug}
                  </motion.p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
