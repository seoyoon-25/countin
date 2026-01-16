'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@countin/ui';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const sections = [
  { id: 'overview', title: '제1조 (목적)' },
  { id: 'definitions', title: '제2조 (정의)' },
  { id: 'agreement', title: '제3조 (약관의 효력)' },
  { id: 'service', title: '제4조 (서비스 제공)' },
  { id: 'membership', title: '제5조 (회원가입)' },
  { id: 'obligations', title: '제6조 (회원의 의무)' },
  { id: 'company-obligations', title: '제7조 (회사의 의무)' },
  { id: 'payment', title: '제8조 (유료서비스)' },
  { id: 'termination', title: '제9조 (계약 해지)' },
  { id: 'liability', title: '제10조 (면책조항)' },
  { id: 'disputes', title: '제11조 (분쟁해결)' },
];

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">이용약관</h1>
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
                <h2 className="text-xl font-bold text-slate-900 mb-4">제1조 (목적)</h2>
                <p className="text-slate-600 leading-relaxed">
                  본 약관은 유니피벗(이하 "회사")이 제공하는 CountIn 서비스(이하 "서비스")의
                  이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을
                  규정함을 목적으로 합니다.
                </p>
              </section>

              <section id="definitions" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제2조 (정의)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>"서비스"란 회사가 제공하는 소규모 조직 회계 관리 플랫폼 CountIn을 말합니다.</li>
                  <li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
                  <li>"조직"이란 회원이 서비스 내에서 생성한 단체 또는 기업을 말합니다.</li>
                  <li>"콘텐츠"란 회원이 서비스를 이용하면서 생성한 문서, 거래내역, 보고서 등의 자료를 말합니다.</li>
                </ol>
              </section>

              <section id="agreement" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제3조 (약관의 효력)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</li>
                  <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                  <li>변경된 약관은 서비스 내 공지 또는 이메일을 통해 회원에게 통지합니다.</li>
                  <li>회원이 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.</li>
                </ol>
              </section>

              <section id="service" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제4조 (서비스 제공)</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회사는 다음과 같은 서비스를 제공합니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>회계 거래 관리 및 기록</li>
                  <li>예산 편성 및 관리</li>
                  <li>프로젝트/재원 관리</li>
                  <li>문서 작성 및 관리</li>
                  <li>보고서 생성 및 내보내기</li>
                  <li>AI 기반 자동 분류 및 문서 작성 지원</li>
                  <li>기타 회사가 정하는 서비스</li>
                </ul>
              </section>

              <section id="membership" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제5조 (회원가입)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>회원가입은 이용자가 본 약관에 동의하고 회원정보를 입력한 후 회사가 이를 승낙함으로써 성립합니다.</li>
                  <li>회원은 가입 시 정확하고 최신의 정보를 제공해야 합니다.</li>
                  <li>만 14세 미만의 아동은 법정대리인의 동의 없이 가입할 수 없습니다.</li>
                </ol>
              </section>

              <section id="obligations" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제6조 (회원의 의무)</h2>
                <p className="text-slate-600 leading-relaxed mb-4">
                  회원은 다음 행위를 하여서는 안 됩니다:
                </p>
                <ul className="list-disc list-inside space-y-2 text-slate-600">
                  <li>타인의 정보를 도용하거나 허위 정보를 등록하는 행위</li>
                  <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위</li>
                  <li>회사의 지식재산권을 침해하는 행위</li>
                  <li>서비스의 운영을 방해하거나 안정성을 해치는 행위</li>
                  <li>다른 회원의 개인정보를 무단으로 수집하거나 유출하는 행위</li>
                </ul>
              </section>

              <section id="company-obligations" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제7조 (회사의 의무)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>회사는 안정적인 서비스 제공을 위해 최선을 다합니다.</li>
                  <li>회사는 회원의 개인정보를 보호하기 위해 적절한 보안 조치를 취합니다.</li>
                  <li>회사는 서비스 장애 발생 시 신속하게 복구하도록 노력합니다.</li>
                  <li>회사는 회원의 불만 또는 피해 구제 요청을 성실하게 처리합니다.</li>
                </ol>
              </section>

              <section id="payment" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제8조 (유료서비스)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>회사는 무료 서비스와 유료 서비스를 제공하며, 유료 서비스의 이용요금은 서비스 내에 명시합니다.</li>
                  <li>유료 서비스 이용 시 회원은 정해진 결제 방법에 따라 이용요금을 지불해야 합니다.</li>
                  <li>결제 취소 및 환불은 관련 법령 및 회사의 환불 정책에 따릅니다.</li>
                  <li>연간 결제 시 월간 결제 대비 할인이 적용되며, 중도 해지 시 잔여 기간에 대한 환불은 회사 정책에 따릅니다.</li>
                </ol>
              </section>

              <section id="termination" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제9조 (계약 해지)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>회원은 언제든지 서비스 내 설정 메뉴를 통해 탈퇴를 신청할 수 있습니다.</li>
                  <li>회원 탈퇴 시 회원의 콘텐츠는 즉시 삭제되며, 삭제된 데이터는 복구할 수 없습니다.</li>
                  <li>회사는 회원이 본 약관을 위반한 경우 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
                </ol>
              </section>

              <section id="liability" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제10조 (면책조항)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>회사는 천재지변 또는 불가항력적인 사유로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용 장애에 대해 책임지지 않습니다.</li>
                  <li>회사는 회원이 서비스를 통해 생성한 콘텐츠의 정확성이나 적법성에 대해 보증하지 않습니다.</li>
                  <li>회사가 제공하는 AI 기능의 결과물은 참고용이며, 최종 판단은 회원의 책임입니다.</li>
                </ol>
              </section>

              <section id="disputes" className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">제11조 (분쟁해결)</h2>
                <ol className="list-decimal list-inside space-y-2 text-slate-600">
                  <li>본 약관은 대한민국 법령에 따라 규율되고 해석됩니다.</li>
                  <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 회원은 원만한 해결을 위해 성실히 협의합니다.</li>
                  <li>협의가 이루어지지 않는 경우, 관할 법원에 소송을 제기할 수 있습니다.</li>
                </ol>
              </section>

              <div className="mt-12 p-6 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500">
                  <strong>운영사:</strong> 유니피벗
                  <br />
                  <strong>서비스명:</strong> CountIn
                  <br />
                  <strong>문의:</strong> support@countin.app
                </p>
              </div>
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
              <Link href="/terms" className="text-white">이용약관</Link>
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
