'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Badge } from '@countin/ui';

const PLANS = [
  {
    id: 'free',
    name: '무료',
    description: '소규모 조직을 위한 기본 기능',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: '문서 3개', included: true },
      { name: '거래 50건/월', included: true },
      { name: 'AI 3회/월', included: true },
      { name: '기본 보고서', included: true },
      { name: '1명 사용자', included: true },
      { name: '이메일 지원', included: false },
      { name: 'PDF/Word 내보내기', included: false },
      { name: '우선 지원', included: false },
    ],
    cta: '무료로 시작하기',
    popular: false,
  },
  {
    id: 'light',
    name: '라이트',
    description: '성장하는 조직을 위한 필수 기능',
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    features: [
      { name: '문서 20개', included: true },
      { name: '거래 500건/월', included: true },
      { name: 'AI 30회/월', included: true },
      { name: '기본 보고서', included: true },
      { name: '3명 사용자', included: true },
      { name: '이메일 지원', included: true },
      { name: 'PDF/Word 내보내기', included: true },
      { name: '우선 지원', included: false },
    ],
    cta: '30일 무료 체험',
    popular: false,
  },
  {
    id: 'standard',
    name: '스탠다드',
    description: '중규모 조직을 위한 완전한 기능',
    monthlyPrice: 29900,
    yearlyPrice: 299000,
    features: [
      { name: '문서 무제한', included: true },
      { name: '거래 무제한', included: true },
      { name: 'AI 100회/월', included: true },
      { name: '고급 보고서', included: true },
      { name: '10명 사용자', included: true },
      { name: '이메일 지원', included: true },
      { name: 'PDF/Word 내보내기', included: true },
      { name: '우선 지원', included: true },
    ],
    cta: '30일 무료 체험',
    popular: true,
  },
  {
    id: 'pro',
    name: '프로',
    description: '대규모 조직을 위한 엔터프라이즈급',
    monthlyPrice: 59900,
    yearlyPrice: 599000,
    features: [
      { name: '문서 무제한', included: true },
      { name: '거래 무제한', included: true },
      { name: 'AI 무제한', included: true },
      { name: '커스텀 보고서', included: true },
      { name: '무제한 사용자', included: true },
      { name: '전화/이메일 지원', included: true },
      { name: 'PDF/Word 내보내기', included: true },
      { name: '전담 매니저', included: true },
    ],
    cta: '30일 무료 체험',
    popular: false,
  },
];

const FEATURE_COMPARISON = [
  { category: '기본 기능', features: [
    { name: '문서 관리', free: '3개', light: '20개', standard: '무제한', pro: '무제한' },
    { name: '거래 등록', free: '50건/월', light: '500건/월', standard: '무제한', pro: '무제한' },
    { name: 'AI 기능', free: '3회/월', light: '30회/월', standard: '100회/월', pro: '무제한' },
    { name: '사용자 수', free: '1명', light: '3명', standard: '10명', pro: '무제한' },
  ]},
  { category: '보고서', features: [
    { name: '기본 보고서', free: true, light: true, standard: true, pro: true },
    { name: '고급 보고서', free: false, light: false, standard: true, pro: true },
    { name: '커스텀 보고서', free: false, light: false, standard: false, pro: true },
    { name: 'PDF/Word 내보내기', free: false, light: true, standard: true, pro: true },
  ]},
  { category: '지원', features: [
    { name: '이메일 지원', free: false, light: true, standard: true, pro: true },
    { name: '우선 지원', free: false, light: false, standard: true, pro: true },
    { name: '전화 지원', free: false, light: false, standard: false, pro: true },
    { name: '전담 매니저', free: false, light: false, standard: false, pro: true },
  ]},
];

function formatCurrency(value: number): string {
  if (value === 0) return '무료';
  return `₩${value.toLocaleString()}`;
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">CountIn</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">로그인</Button>
            </Link>
            <Link href="/signup">
              <Button>시작하기</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4"
        >
          <Badge className="mb-4 bg-violet-100 text-violet-700">
            <Sparkles className="w-3 h-3 mr-1" />
            30일 무료 체험
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            조직에 맞는 요금제를 선택하세요
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            모든 유료 플랜은 30일 무료 체험을 제공합니다.
            <br />
            언제든지 취소할 수 있으며, 약정 없이 이용 가능합니다.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              월간 결제
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? 'bg-primary-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isYearly ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${isYearly ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
              연간 결제
              <Badge className="ml-2 bg-emerald-100 text-emerald-700">16% 할인</Badge>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl border-2 p-6 ${
                  plan.popular
                    ? 'border-primary-500 shadow-xl shadow-primary-500/10'
                    : 'border-slate-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary-600 text-white">가장 인기</Badge>
                  </div>
                )}

                <div className="text-left mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="text-left mb-6">
                  <span className="text-4xl font-bold text-slate-900">
                    {formatCurrency(isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice)}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-slate-500">/월</span>
                  )}
                  {isYearly && plan.yearlyPrice > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      연 {formatCurrency(plan.yearlyPrice)} 결제
                    </p>
                  )}
                </div>

                <Link href="/signup">
                  <Button
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className={feature.included ? 'text-slate-700' : 'text-slate-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            상세 기능 비교
          </h2>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 text-left text-sm font-medium text-slate-500">기능</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-slate-900">무료</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-slate-900">라이트</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-primary-600">스탠다드</th>
                  <th className="py-4 px-4 text-center text-sm font-medium text-slate-900">프로</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((category) => (
                  <>
                    <tr key={category.category} className="bg-slate-50">
                      <td colSpan={5} className="py-3 px-4 text-sm font-semibold text-slate-700">
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-600">{feature.name}</td>
                        {['free', 'light', 'standard', 'pro'].map((plan) => (
                          <td key={plan} className="py-3 px-4 text-center">
                            {typeof feature[plan as keyof typeof feature] === 'boolean' ? (
                              feature[plan as keyof typeof feature] ? (
                                <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                              ) : (
                                <X className="w-5 h-5 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-sm text-slate-700">
                                {feature[plan as keyof typeof feature]}
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            30일 무료 체험으로 CountIn의 모든 기능을 경험해보세요.
            <br />
            신용카드 없이 시작할 수 있습니다.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-primary-600 hover:bg-primary-50">
              무료로 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-white font-medium">CountIn</span>
              <span className="text-sm">by 유니피벗</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition-colors">
                이용약관
              </Link>
              <Link href="/terms/privacy" className="hover:text-white transition-colors">
                개인정보처리방침
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
