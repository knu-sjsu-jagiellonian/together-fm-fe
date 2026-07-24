import { LoginClient } from './login-client'

// justify-center-safe: 계정 목록이 프레임보다 길어지면 가운데 정렬 대신 위쪽 정렬로
// 떨어진다. 그냥 justify-center면 넘친 만큼이 위아래로 반씩 삐져나가는데, 위쪽
// 오버플로는 스크롤로 되돌아갈 수 없어 브랜드 헤더와 첫 줄이 잘린다.
export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 flex-col justify-center-safe px-8 py-12">
      <LoginClient />
    </main>
  )
}
