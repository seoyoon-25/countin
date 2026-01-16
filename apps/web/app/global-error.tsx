'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#fee2e2',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#0f172a',
                marginBottom: '12px',
              }}
            >
              시스템 오류가 발생했습니다
            </h1>

            <p
              style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '24px',
                lineHeight: '1.6',
              }}
            >
              죄송합니다. 예기치 않은 시스템 오류가 발생했습니다.
              <br />
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>

            {error.digest && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  marginBottom: '24px',
                }}
              >
                오류 코드: {error.digest}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#0f172a',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                홈으로 이동
              </a>
            </div>

            <div
              style={{
                marginTop: '32px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                문제가 계속되면{' '}
                <a
                  href="mailto:support@countin.app"
                  style={{ color: '#2563eb' }}
                >
                  support@countin.app
                </a>
                으로 문의해 주세요.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
