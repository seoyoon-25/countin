'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const customers = [
  {
    type: '비영리단체',
    description: '재원별 관리, 정산보고서 자동 생성으로 후원금 관리가 투명해집니다.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    examples: ['사회복지법인', 'NGO', '종교단체', '시민단체'],
    color: 'rose',
    bgGradient: 'from-rose-50 to-pink-50',
    iconBg: 'from-rose-500 to-pink-500',
  },
  {
    type: '영리법인',
    description: '간편한 수입/지출 관리와 재무제표 자동 생성으로 경영 현황을 파악하세요.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    examples: ['스타트업', '소기업', '중소기업', '1인 법인'],
    color: 'blue',
    bgGradient: 'from-blue-50 to-indigo-50',
    iconBg: 'from-blue-500 to-indigo-500',
  },
  {
    type: '개인사업자',
    description: '세금 신고를 위한 장부 관리가 쉬워집니다. 간편장부도 지원합니다.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    examples: ['프리랜서', '소상공인', '자영업자', '크리에이터'],
    color: 'amber',
    bgGradient: 'from-amber-50 to-orange-50',
    iconBg: 'from-amber-500 to-orange-500',
  },
  {
    type: '사회적기업',
    description: '사회적 가치와 경제적 성과를 함께 관리하세요. 사회적 영향 보고서도 제공합니다.',
    icon: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    examples: ['마을기업', '협동조합', '자활기업', '소셜벤처'],
    color: 'emerald',
    bgGradient: 'from-emerald-50 to-teal-50',
    iconBg: 'from-emerald-500 to-teal-500',
  },
];

export function Customers() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="customers" className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <span className="text-indigo-600 font-semibold">For Everyone</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">
            모든 조직 유형을 지원합니다
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            비영리부터 영리까지, 조직 특성에 맞는 맞춤형 회계 솔루션을 제공합니다.
          </p>
        </motion.div>

        {/* Customer type cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.type}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${customer.bgGradient} p-8 border border-slate-100 group`}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/30 rounded-full blur-2xl" />

              <div className="relative">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${customer.iconBg} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {customer.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {customer.type}
                </h3>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {customer.description}
                </p>

                {/* Example tags */}
                <div className="flex flex-wrap gap-2">
                  {customer.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 bg-white/70 rounded-full text-sm text-slate-700 border border-slate-200"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
