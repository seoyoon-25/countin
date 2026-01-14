import { Button, Card, CardContent, CardHeader, CardTitle } from '@countin/ui';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-600">CountIn</h1>
          <p className="mt-2 text-lg text-slate-500">
            Count me in! 쉬운 회계의 시작
          </p>
        </div>

        {/* Hero Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>소규모 조직을 위한 올인원 회계 플랫폼</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              비영리단체, 영리법인, 개인사업자, 사회적기업 등<br />
              다양한 조직 유형을 지원합니다.
            </p>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-8 grid grid-cols-2 gap-4 text-left">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 text-2xl">📊</div>
              <h3 className="font-semibold text-slate-900">쉬운 회계</h3>
              <p className="text-sm text-slate-500">회계 지식 없이도 사용 가능</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 text-2xl">📄</div>
              <h3 className="font-semibold text-slate-900">문서 빌더</h3>
              <p className="text-sm text-slate-500">사업계획서, 정산보고서 자동 생성</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 text-2xl">🤖</div>
              <h3 className="font-semibold text-slate-900">AI 자동화</h3>
              <p className="text-sm text-slate-500">예산 자동 생성, 문서 보완</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 text-2xl">💰</div>
              <h3 className="font-semibold text-slate-900">재원 관리</h3>
              <p className="text-sm text-slate-500">비영리단체 재원별 관리</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex justify-center gap-4">
          <Button size="lg">시작하기</Button>
          <Button variant="outline" size="lg">더 알아보기</Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-slate-400">
        <p>CountIn by UniPivot</p>
        <p className="mt-1">countin.bestcome.org</p>
      </footer>
    </main>
  );
}
