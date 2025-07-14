# Documentory API 레퍼런스

## 개요
Documentory에서 제공하는 모든 도구들의 상세한 사용법을 설명합니다.

## 공통 응답 형식
모든 도구는 다음 형식으로 응답을 반환합니다:
```json
{
  "content": [
    {
      "type": "text",
      "text": "응답 내용"
    }
  ]
}
```

## 도구 목록

### 1. listDocuments
**목적**: docs 폴더의 모든 Markdown 문서 목록을 조회합니다.

**입력 매개변수**: 없음

**출력 예시**:
```
docs 폴더의 Markdown 문서 목록:

- api-reference.md
- architecture.md
- project-overview.md
```

**사용 사례**:
- 프로젝트에 어떤 문서들이 있는지 확인
- 문서 작성 전 중복 확인
- 전체 문서 구조 파악

### 2. readDocument
**목적**: 특정 Markdown 문서의 내용을 읽습니다.

**입력 매개변수**:
- `filename` (string, 필수): 읽을 문서의 파일명

**출력 예시**:
```
📄 project-overview.md

# Documentory 프로젝트 개요
...
```

**오류 처리**:
- 파일이 존재하지 않을 경우: "파일을 찾을 수 없습니다: {filename}"

**사용 사례**:
- 기존 문서 내용 확인
- 문서 수정 전 현재 상태 파악
- 관련 정보 검색

### 3. writeDocument
**목적**: 새로운 Markdown 문서를 작성합니다.

**입력 매개변수**:
- `filename` (string, 필수): 생성할 문서의 파일명
- `content` (string, 필수): 문서의 내용 (Markdown 형식)

**출력 예시**:
```
✅ 문서가 성공적으로 생성되었습니다: new-feature.md
```

**오류 처리**:
- 파일이 이미 존재할 경우: "파일이 이미 존재합니다: {filename}. updateDocument를 사용하세요."

**사용 사례**:
- 새로운 기능 문서 작성
- 프로젝트 가이드 추가
- 클래스/모듈 문서화

### 4. updateDocument
**목적**: 기존 Markdown 문서를 수정합니다.

**입력 매개변수**:
- `filename` (string, 필수): 수정할 문서의 파일명
- `content` (string, 필수): 새로운 내용 (Markdown 형식)

**출력 예시**:
```
✅ 문서가 성공적으로 수정되었습니다: project-overview.md
```

**오류 처리**:
- 파일이 존재하지 않을 경우: "파일을 찾을 수 없습니다: {filename}"

**사용 사례**:
- 기존 문서 내용 업데이트
- 버전 정보 수정
- 오타 수정

### 5. deleteDocument
**목적**: Markdown 문서를 삭제합니다.

**입력 매개변수**:
- `filename` (string, 필수): 삭제할 문서의 파일명

**출력 예시**:
```
✅ 문서가 성공적으로 삭제되었습니다: old-feature.md
```

**오류 처리**:
- 파일이 존재하지 않을 경우: "파일을 찾을 수 없습니다: {filename}"

**사용 사례**:
- 더 이상 필요하지 않은 문서 제거
- 중복 문서 정리
- 프로젝트 구조 정리

### 6. searchDocuments
**목적**: 모든 문서에서 키워드를 검색합니다.

**입력 매개변수**:
- `keyword` (string, 필수): 검색할 키워드

**출력 예시**:
```
🔍 "API" 검색 결과:

**api-reference.md**:
  1: # Documentory API 레퍼런스
  25: ## API 도구 목록
  45: ### API 사용 예시

**architecture.md**:
  30: ### 4. Tools API
```

**검색 특징**:
- 대소문자 구분 없음
- 파일별로 최대 3개 결과 표시
- 줄 번호와 함께 컨텍스트 제공

**사용 사례**:
- 특정 주제 관련 문서 찾기
- 키워드 기반 정보 검색
- 문서 간 연관성 파악

## Documentory의 고급 기능

### 스마트 검색
- 유사한 의미의 키워드 매칭
- 관련 문서 추천
- 검색 히스토리 관리

### 자동 링크 생성
- 문서 간 참조 자동 감지
- 관련 문서 링크 추가
- 브로큰 링크 감지 및 수정

## 권장 사용 패턴

1. **문서 생성 워크플로우**:
   ```
   listDocuments → writeDocument → readDocument (검증)
   ```

2. **문서 수정 워크플로우**:
   ```
   searchDocuments → readDocument → updateDocument
   ```

3. **문서 정리 워크플로우**:
   ```
   listDocuments → readDocument (확인) → deleteDocument
   ```

## 베스트 프랙티스

- 파일명은 kebab-case 사용 (예: `user-service.md`)
- 문서는 명확한 제목과 구조 사용
- 검색 키워드는 구체적으로 입력
- 삭제 전 반드시 내용 확인
- 정기적인 문서 검토 및 업데이트

## Documentory의 장점

### AI와의 완벽한 협업
- 자연어 명령으로 문서 관리
- 컨텍스트 인식 기반 문서 추천
- 자동 문서 구조 최적화

### 개발 워크플로우 통합
- 코드 변경과 연동된 문서 업데이트
- PR/커밋과 연결된 문서 버전 관리
- 실시간 문서 동기화 