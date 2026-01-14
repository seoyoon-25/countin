export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 p-12 flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CountIn</h1>
          <p className="mt-2 text-primary-200">쉬운 회계의 시작</p>
        </div>
        <div className="text-white">
          <blockquote className="text-xl font-medium mb-4">
            "복잡한 회계를 쉽고 직관적으로.<br />
            당신의 조직에 딱 맞는 회계 솔루션."
          </blockquote>
          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center text-white text-sm font-medium">유</div>
              <div className="w-10 h-10 rounded-full bg-primary-300 flex items-center justify-center text-white text-sm font-medium">비</div>
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">사</div>
            </div>
            <p className="text-primary-200 text-sm">
              100+ 조직이 CountIn을 사용 중
            </p>
          </div>
        </div>
        <p className="text-primary-300 text-sm">
          © {new Date().getFullYear()} UniPivot. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
