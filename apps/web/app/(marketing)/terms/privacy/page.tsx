'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@countin/ui';
import { ArrowLeft } from 'lucide-react';

const sections = [
  { id: 'overview', title: '개요' },
  { id: 'collection', title: '수집하는 개인정보' },
  { id: 'purpose', title: '개인정보의 이용목적' },
  { id: 'sharing', title: '개인정보의 제공' },
  { id: 'retention', title: '개인정보의 보유기간' },
  { id: 'rights', title: '정보주체의 권리' },
  { id: 'security', title: '개인정보의 보호조치' },
  { id: 'cookies', title: '쿠키 사용' },
  { id: 'changes', title: '방침의 변경' },
  { id: 'contact', title: '문의처' },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">CountIn</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              홈으로
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">개인정보처리방침</h1>
          <p className="text-slate-500 mb-8">최종 수정일: 2024년 1월 1일</p>

          <div className="flex gap-8">
            {/* Table of Contents - Desktop */}
            <nav className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-1">
                <p className="text-sm font-medium text-slate-500 mb-3">목차</p>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 prose prose-slate max-w-none">
              <section id="overview" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">개요</h2>
                <p className="text-slate-600 leading-relaxed">
                  유니피벗(이하 "회사")는 CountIn 서비스(이하 "서비스")를 제공함에 있어
                  정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보 보호법 등 관련 법령을 준수하며,
                  회원의 개인정보를 보호하기 위해 최선을 다하고 있습니다.
                </p>
                <p className="text-slate-600 leading-relaxed mt-4">
                  본 개인정보처리방침은 회사가 수집하는 개인정보의 종류, 이용 목적, 보유 기간,
                  그리고 정보주체의 권리에 대해 설명합니다.
                </p>
              </section>

              <section id="collection" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">수집하는 개인정보</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
                </p>

                <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">필수 수집 항목</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>이메일 주소:</strong> 회원 식별, 로그인, 중요 알림 발송</li>
                  <li><strong>이름:</strong> 서비스 내 표시 및 본인 확인</li>
                  <li><strong>비밀번호:</strong> 계정 보안 (암호화 저장)</li>
                </ul>

                <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">선택 수집 항목</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>조직 정보:</strong> 조직명, 조직 유형, 로고</li>
                  <li><strong>프로필 이미지:</strong> 서비스 내 프로필 표시</li>
                </ul>

                <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">자동 수집 항목</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>접속 로그:</strong> IP 주소, 접속 시간, 브라우저 정보</li>
                  <li><strong>서비스 이용 기록:</strong> 기능 사용 현황 (서비스 개선 목적)</li>
                </ul>
              </section>

              <section id="purpose" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">개인정보의 이용목적</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  수집된 개인정보는 다음의 목적으로만 이용됩니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>서비스 제공:</strong> 회계 관리, 문서 작성, 보고서 생성 등 핵심 기능 제공</li>
                  <li><strong>회원 관리:</strong> 회원 가입, 본인 확인, 불량 회원 관리</li>
                  <li><strong>고객 지원:</strong> 문의 응대, 불만 처리, 공지사항 전달</li>
                  <li><strong>서비스 개선:</strong> 이용 현황 분석, 신규 기능 개발</li>
                  <li><strong>마케팅:</strong> 이벤트 안내, 혜택 정보 제공 (동의한 경우에 한함)</li>
                </ul>
              </section>

              <section id="sharing" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">개인정보의 제공</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다.
                  다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>회원이 사전에 동의한 경우</li>
                  <li>법령의 규정에 의한 경우</li>
                  <li>수사 기관의 요청이 있는 경우 (적법한 절차에 따름)</li>
                </ul>
              </section>

              <section id="retention" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">개인정보의 보유기간</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                </p>

                <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">회원 정보</h3>
                <p className="text-slate-600 leading-relaxed">
                  <strong>보유 기간:</strong> 회원 탈퇴 시 즉시 삭제
                  <br />
                  단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                </p>

                <h3 className="text-lg font-semibold text-slate-800 mt-6 mb-3">법령에 따른 보존</h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                  <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)</li>
                  <li>소비자 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)</li>
                  <li>접속에 관한 기록: 3개월 (통신비밀보호법)</li>
                </ul>
              </section>

              <section id="rights" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">정보주체의 권리</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회원은 언제든지 다음의 권리를 행사할 수 있습니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>개인정보 열람 요구:</strong> 회사가 보유한 본인의 개인정보 열람</li>
                  <li><strong>개인정보 정정 요구:</strong> 오류가 있는 개인정보의 정정 또는 삭제</li>
                  <li><strong>처리정지 요구:</strong> 개인정보 처리의 정지</li>
                  <li><strong>동의 철회:</strong> 개인정보 수집 및 이용 동의의 철회</li>
                  <li><strong>회원 탈퇴:</strong> 서비스 설정에서 직접 탈퇴 가능</li>
                </ul>
                <p className="text-slate-600 leading-relaxed mt-4">
                  권리 행사는 서비스 내 설정 메뉴 또는 고객센터를 통해 가능합니다.
                </p>
              </section>

              <section id="security" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">개인정보의 보호조치</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>기술적 조치:</strong> 비밀번호 암호화, SSL/TLS 통신, 접근 권한 관리</li>
                  <li><strong>관리적 조치:</strong> 개인정보 취급 직원 최소화, 정기 교육 실시</li>
                  <li><strong>물리적 조치:</strong> 서버 접근 통제, 자료 보관 시설 관리</li>
                </ul>
              </section>

              <section id="cookies" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">쿠키 사용</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 서비스 이용 편의를 위해 쿠키를 사용합니다.
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li><strong>필수 쿠키:</strong> 로그인 상태 유지, 보안</li>
                  <li><strong>분석 쿠키:</strong> 서비스 이용 현황 분석 (선택적)</li>
                </ul>
                <p className="text-slate-600 leading-relaxed mt-4">
                  브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 기능 이용에 제한이 있을 수 있습니다.
                </p>
              </section>

              <section id="changes" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">방침의 변경</h2>
                <p className="text-slate-600 leading-relaxed">
                  본 개인정보처리방침은 법령, 정책, 보안 기술의 변경에 따라 수정될 수 있습니다.
                  변경 시 서비스 내 공지 또는 이메일을 통해 안내드립니다.
                </p>
              </section>

              <section id="contact" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">문의처</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  개인정보 관련 문의사항은 아래 연락처로 문의해 주시기 바랍니다:
                </p>
                <div className="p-6 bg-slate-50 rounded-xl">
                  <p className="text-slate-700">
                    <strong>개인정보 보호책임자:</strong> 유니피벗 개인정보보호팀
                    <br />
                    <strong>이메일:</strong> privacy@countin.app
                    <br />
                    <strong>전화:</strong> 02-xxxx-xxxx
                  </p>
                </div>
                <p className="text-slate-600 leading-relaxed mt-4">
                  기타 개인정보 침해에 대한 신고나 상담은 아래 기관에 문의하실 수 있습니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600 mt-2">
                  <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
                  <li>대검찰청 사이버수사과 (www.spo.go.kr / 1301)</li>
                  <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>

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
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <Link href="/terms/privacy" className="text-white">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
