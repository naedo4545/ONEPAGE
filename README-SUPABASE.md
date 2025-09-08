# ONEPAGE - Digital Business Card Maker with Supabase

## 🚀 Supabase 설정 및 배포 가이드

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 API URL과 anon key를 복사합니다.

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

예시:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. 데이터베이스 스키마 설정

1. Supabase 대시보드의 SQL Editor로 이동합니다.
2. `supabase-schema.sql` 파일의 내용을 복사하여 실행합니다.
3. 이 스크립트는 다음을 생성합니다:
   - 사용자 테이블
   - 비즈니스 카드 테이블
   - 미디어 샘플 테이블
   - 피드백 테이블
   - 비디오 요청 테이블
   - 필요한 인덱스와 함수들
   - Row Level Security (RLS) 정책들

### 4. 인증 설정

Supabase 대시보드의 Authentication > Settings에서:
1. Site URL을 설정합니다 (개발: `http://localhost:5173`, 프로덕션: 실제 도메인)
2. Redirect URLs를 설정합니다
3. 이메일 인증을 활성화합니다 (선택사항)

### 5. 스토리지 설정 (선택사항)

미디어 파일을 Supabase Storage에 저장하려면:
1. Storage > Buckets에서 새 버킷을 생성합니다
2. 버킷 정책을 설정합니다
3. `supabaseService.ts`에서 파일 업로드 함수를 구현합니다

### 6. 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 7. 배포

#### Vercel 배포
1. [Vercel](https://vercel.com)에 프로젝트를 연결합니다
2. 환경 변수를 Vercel 대시보드에서 설정합니다:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. 자동 배포가 시작됩니다

#### Netlify 배포
1. [Netlify](https://netlify.com)에 프로젝트를 연결합니다
2. 환경 변수를 Netlify 대시보드에서 설정합니다
3. 빌드 명령어: `npm run build`
4. 배포 디렉토리: `dist`

### 8. 프로덕션 설정

배포 후 다음을 확인하세요:
1. Supabase 프로젝트의 Site URL을 실제 도메인으로 업데이트
2. CORS 설정 확인
3. RLS 정책이 올바르게 작동하는지 확인

### 9. 주요 기능

- ✅ 사용자 인증 (Supabase Auth)
- ✅ 비즈니스 카드 저장 및 관리
- ✅ 미디어 샘플 관리
- ✅ 피드백 시스템
- ✅ 비디오 제작 요청
- ✅ 다국어 지원 (한국어, 영어, 일본어)
- ✅ 반응형 디자인
- ✅ 다크 모드 지원

### 10. 문제 해결

#### 일반적인 문제들:

1. **환경 변수가 인식되지 않는 경우**
   - `.env.local` 파일이 프로젝트 루트에 있는지 확인
   - 변수명이 `VITE_`로 시작하는지 확인
   - 개발 서버를 재시작

2. **데이터베이스 연결 오류**
   - Supabase URL과 키가 올바른지 확인
   - RLS 정책이 올바르게 설정되었는지 확인

3. **인증 오류**
   - Site URL이 올바르게 설정되었는지 확인
   - Redirect URLs이 설정되었는지 확인

### 11. 보안 고려사항

- RLS (Row Level Security)가 모든 테이블에 활성화되어 있습니다
- 사용자는 자신의 데이터만 접근할 수 있습니다
- 공개 카드는 모든 사용자가 볼 수 있습니다
- 미디어 샘플은 읽기 전용으로 설정되어 있습니다

### 12. 추가 개발

더 많은 기능을 추가하려면:
1. `supabaseService.ts`에 새로운 함수 추가
2. `apiService.supabase.ts`에서 해당 함수 호출
3. 필요시 데이터베이스 스키마 업데이트
4. RLS 정책 업데이트

---

## 📞 지원

문제가 있거나 질문이 있으시면 이슈를 생성해주세요.


