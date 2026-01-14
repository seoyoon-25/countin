'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Button } from '@countin/ui';
import { cn } from '@countin/utils';

const plans = [
  {
    name: '무료',
    price: '0',
    description: '개인 또는 소규모 팀을 위한 기본 기능',
    features: [
      '월 50건 거래 입력',
      '기본 보고서',
      '1명 사용자',
      '이메일 지원',
    ],
    cta: '무료로 시작',
    highlighted: false,
  },
  {
    name: '라이트',
    price: '19,000',
    description: '성장하는 조직을 위한 필수 기능',
    features: [
      '월 500건 거래 입력',
      '모든 보고서',
      '3명 사용자',
      '재원 관리',
      '문서 빌더 (기본)',
      '채팅 지원',
    ],
    cta: '30일 무료 체험',
    highlighted: false,
  },
  {
    name: '스탠다드',
    price: '49,000',
    description: '전문적인 회계 관리가 필요한 조직',
    features: [
      '무제한 거래 입력',
      '모든 보고서',
      '10명 사용자',
      '재원 관리',
      '문서 빌더 (전체)',
      'AI 자동화 (월 100회)',
      '프로젝트 관리',
      '우선 지원',
    ],
    cta: '30일 무료 체험',
    highlighted: true,
    badge: '인기',
  },
  {
    name: '프로',
    price: '99,000',
    description: '대규모 조직을 위한 모든 기능',
    features: [
      '무제한 거래 입력',
      '모든 보고서',
      '무제한 사용자',
      '재원 관리',
      '문서 빌더 (전체)',
      'AI 자동화 (무제한)',
      '프로젝트 관리',
      'API 연동',
      '전담 매니저',
      'SLA 보장',
    ],
    cta: '영업팀 문의',
    highlighted: false,
  },
];

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-indigo-600 font-semibold">Pricing</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            합리적인 요금제
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            조직 규모에 맞는 요금제를 선택하세요. 언제든 업그레이드할 수 있습니다.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <span className={cn('text-sm', !annual ? 'text-slate-900 font-medium' : 'text-slate-500')}>
              월간 결제
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className={cn(
                'relative w-14 h-7 rounded-full transition-colors',
                annual ? 'bg-indigo-600' : 'bg-slate-300'
              )}
            >
              <motion.div
                layout
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
                style={{ left: annual ? 'calc(100% - 1.5rem)' : '0.25rem' }}
              />
            </button>
            <span className={cn('text-sm', annual ? 'text-slate-900 font-medium' : 'text-slate-500')}>
              연간 결제
              <span className="ml-1 text-emerald-600 font-semibold">-20%</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                'relative rounded-2xl p-6 border',
                plan.highlighted
                  ? 'bg-gradient-to-b from-indigo-600 to-indigo-700 border-indigo-500 text-white shadow-xl shadow-indigo-500/25 scale-105 z-10'
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-lg transition-all'
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3 className={cn(
                'text-lg font-bold',
                plan.highlighted ? 'text-white' : 'text-slate-900'
              )}>
                {plan.name}
              </h3>

              {/* Price */}
              <div className="mt-4 flex items-baseline">
                <span className={cn(
                  'text-4xl font-bold',
                  plan.highlighted ? 'text-white' : 'text-slate-900'
                )}>
                  ₩{annual ? plan.price : Math.round(parseInt(plan.price.replace(',', '')) * 1.25).toLocaleString()}
                </span>
                <span className={cn(
                  'ml-2 text-sm',
                  plan.highlighted ? 'text-indigo-200' : 'text-slate-500'
                )}>
                  /월
                </span>
              </div>

              {/* Description */}
              <p className={cn(
                'mt-2 text-sm',
                plan.highlighted ? 'text-indigo-200' : 'text-slate-500'
              )}>
                {plan.description}
              </p>

              {/* Features */}
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <svg
                      className={cn(
                        'w-5 h-5 flex-shrink-0 mt-0.5',
                        plan.highlighted ? 'text-emerald-300' : 'text-emerald-500'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={cn(
                      'text-sm',
                      plan.highlighted ? 'text-indigo-100' : 'text-slate-600'
                    )}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-8">
                <Link href="/signup">
                  <Button
                    className={cn(
                      'w-full',
                      plan.highlighted
                        ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-sm text-slate-500"
        >
          모든 요금제에 30일 무료 체험이 포함됩니다. 신용카드 정보 없이 시작하세요.
        </motion.p>
      </div>
    </section>
  );
}
