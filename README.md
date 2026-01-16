# CountIn

소규모 조직을 위한 스마트 회계 관리 플랫폼

## 소개

CountIn은 비영리단체, 사회적기업, 소규모 기업을 위한 클라우드 기반 회계 관리 솔루션입니다. AI 기술을 활용하여 복잡한 회계 업무를 간소화하고, 직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다.

## 주요 기능

- **거래 관리**: 수입/지출 기록, 은행 내역 업로드 & AI 자동 분류
- **예산 관리**: 예산 편성, AI 예산 자동 생성, 집행률 추적
- **프로젝트/재원 관리**: 프로젝트별 예산 배정, 담당자 관리
- **문서 작성**: 사업계획서, 정산보고서 등 블록 에디터
- **보고서**: 월별/계정과목별/프로젝트별 보고서 생성
- **AI 기능**: 예산 자동 생성, 문서 내용 보완, 거래 자동 분류

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (Prisma ORM)
- **Authentication**: NextAuth.js
- **AI**: Anthropic Claude API
- **Package Manager**: pnpm (Monorepo with Turborepo)

## 설치 방법

### 사전 요구사항

- Node.js 18.x 이상
- pnpm 8.x 이상

### 로컬 개발 환경

```bash
# 저장소 클론
git clone https://github.com/your-org/countin.git
cd countin

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env

# 데이터베이스 마이그레이션
pnpm prisma:migrate

# 개발 서버 실행
pnpm dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

## 환경 변수

`.env` 파일에 다음 환경 변수를 설정하세요:

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `DATABASE_URL` | 데이터베이스 연결 URL | O |
| `NEXTAUTH_SECRET` | NextAuth 암호화 키 | O |
| `NEXTAUTH_URL` | 애플리케이션 URL | O |
| `ANTHROPIC_API_KEY` | Anthropic Claude API 키 | AI 기능 사용시 |
| `SMTP_HOST` | SMTP 서버 주소 | 이메일 기능 사용시 |
| `SMTP_USER` | SMTP 사용자명 | 이메일 기능 사용시 |
| `SMTP_PASS` | SMTP 비밀번호 | 이메일 기능 사용시 |

## 프로젝트 구조

```
countin/
├── apps/
│   └── web/                 # Next.js 웹 애플리케이션
│       ├── app/             # App Router 페이지
│       ├── components/      # React 컴포넌트
│       └── lib/             # 유틸리티 및 설정
├── packages/
│   ├── database/            # Prisma 스키마 및 클라이언트
│   ├── ui/                  # 공유 UI 컴포넌트
│   ├── utils/               # 공유 유틸리티
│   ├── hooks/               # 공유 React 훅
│   ├── ai/                  # AI 관련 코드
│   └── tsconfig/            # TypeScript 설정
├── nginx/                   # Nginx 설정
├── scripts/                 # 배포 스크립트
└── ecosystem.config.js      # PM2 설정
```

## 배포 방법

### 프로덕션 빌드

```bash
# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

### PM2로 배포

```bash
# PM2 시작
pm2 start ecosystem.config.js

# 상태 확인
pm2 status

# 로그 확인
pm2 logs countin
```

### 자동 배포 스크립트

```bash
./scripts/deploy.sh
```

### Nginx 설정

```bash
# Nginx 설정 파일 복사
sudo cp nginx/countin.conf /etc/nginx/sites-available/countin

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/countin /etc/nginx/sites-enabled/

# SSL 인증서 발급 (Let's Encrypt)
sudo certbot --nginx -d countin.bestcome.org

# Nginx 재시작
sudo systemctl restart nginx
```

## 요금제

| 플랜 | 가격 | 문서 | 거래 | AI |
|------|------|------|------|-----|
| 무료 | ₩0 | 3개 | 50건/월 | 3회/월 |
| 라이트 | ₩9,900/월 | 20개 | 500건/월 | 30회/월 |
| 스탠다드 | ₩29,900/월 | 무제한 | 무제한 | 100회/월 |
| 프로 | ₩59,900/월 | 무제한 | 무제한 | 무제한 |

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 실행 |
| `pnpm typecheck` | TypeScript 타입 체크 |
| `pnpm prisma:migrate` | 데이터베이스 마이그레이션 |
| `pnpm prisma:studio` | Prisma Studio 실행 |

## 라이선스

이 프로젝트는 비공개 소프트웨어입니다. 무단 복제 및 배포를 금지합니다.

## 문의

- **개발사**: 유니피벗
- **이메일**: support@countin.app
- **웹사이트**: https://countin.bestcome.org
