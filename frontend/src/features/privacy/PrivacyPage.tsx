import { Link } from "react-router";
import "./privacy.css";

export function PrivacyPage() {
  return <article className="privacy-page">
    <p className="login-eyebrow">MOODFIT · PRIVACY</p>
    <h1>개인정보 처리 안내</h1>
    <p>시행일: 2026-10-04</p>
    <p>MoodFit은 포트폴리오 / 교육용 웰니스 서비스이며 의료 서비스가 아닙니다. 이 안내는 실제 처리 내용을 설명하며 법률 검토를 거친 문서가 아닙니다.</p>
    <section><h2>처리하는 정보와 목적</h2>
      <table><thead><tr><th scope="col">정보</th><th scope="col">이용 목적</th></tr></thead><tbody>
        <tr><th scope="row">로그인</th><td>Google / Kakao 사용자 번호와 표시 이름(닉네임)을 계정 구분에 사용합니다. 이메일과 프로필 사진은 요청하거나 저장하지 않습니다.</td></tr>
        <tr><th scope="row">체크인</th><td>심박수, 호흡수, 수면 점수, 스트레스, 에너지, 기온, 날씨 종류, 자동 조회 지역 이름, 기록 시각과 규칙이 계산한 점수 / 상태 / 추천을 저장해 결과와 이력을 보여 줍니다.</td></tr>
        <tr><th scope="row">AI 문장</th><td>생성된 AI 코멘트, 주간 리포트와 하루 생성 한도 계산을 위한 생성 시도 기록을 저장합니다.</td></tr>
        <tr><th scope="row">추천 평가</th><td>추천 평가(좋아요 / 별로예요)를 항목별로 저장하여 다음 Check-in의 추천 후보 순서에 반영합니다. 계정 삭제 시 함께 지웁니다.</td></tr>
        <tr><th scope="row">로그인 상태</th><td>로그인 유지용 Cookie와 서버 세션을 사용합니다. 세션은 마지막 사용 뒤 7일 유지됩니다.</td></tr>
        <tr><th scope="row">브라우저 저장</th><td>날씨 자동 조회 사용 여부 한 가지 값을 localStorage에 저장합니다. 계정 삭제 완료 안내를 표시하기 위한 일회용 값을 sessionStorage에 저장하고 로그인 화면에서 읽은 직후 지웁니다. 이 값에는 좌표나 개인 정보를 넣지 않습니다.</td></tr>
        <tr><th scope="row">접속 기록</th><td>서비스 운영을 위해 IP 주소 등이 포함된 Load Balancer 접속 로그와 Application 로그를 30일 보관합니다.</td></tr>
      </tbody></table>
    </section>
    <section><h2>저장하지 않는 정보</h2><p>위도 / 경도는 브라우저에서 날씨와 지역 이름 조회에만 사용합니다. 좌표를 저장하거나 MoodFit 서버로 보내지 않습니다.</p></section>
    <section><h2>외부 서비스로 나가는 정보</h2>
      <table><thead><tr><th scope="col">받는 곳</th><th scope="col">전달 내용과 시점</th></tr></thead><tbody>
        <tr><th scope="row">Google / Kakao</th><td>로그인 요청을 서버와 브라우저에서 전달하며 사용자가 제공자 서비스에서 직접 인증합니다.</td></tr>
        <tr><th scope="row">Open-Meteo / BigDataCloud</th><td>날씨 자동 조회 시 브라우저에서 소수 둘째 자리로 줄인 좌표를 보내 날씨 / 지역 이름을 조회합니다.</td></tr>
        <tr><th scope="row">YouTube</th><td>사용자가 “바로 듣기”를 누를 때 브라우저에서 youtube-nocookie.com으로 영상 요청을 보냅니다.</td></tr>
        <tr><th scope="row">Amazon Bedrock (Anthropic Claude)</th><td>소셜 로그인 사용자가 AI 코멘트 / 주간 리포트를 생성할 때 서버에서 체크인 수치, 날씨, 규칙 결과를 전달합니다. 사용자 번호 / 이름 / 지역 이름 / 좌표 / 기록 번호는 보내지 않습니다. global 추론 Profile을 사용하므로 국외 Region에서 처리될 수 있습니다.</td></tr>
      </tbody></table>
    </section>
    <section><h2>보관 위치와 기간</h2><p>서비스 데이터는 AWS 서울 Region의 Private Subnet에 있는 RDS MySQL에 저장합니다. 계정과 기록, AI 문장과 생성 시도 기록은 계정 삭제 시 지웁니다. 자동 백업은 14일 보관하므로 삭제 전 데이터가 백업에 최대 14일 남을 수 있습니다. 세션은 마지막 사용 뒤 7일, 접속 / Application 로그는 30일 보관합니다.</p></section>
    <section><h2>보호 조치</h2><p>Database 저장 암호화를 사용합니다. 사용자 ↔ CloudFront ↔ Load Balancer 구간은 HTTPS이며 Application ↔ Database 연결에는 TLS를 요구합니다. 로그인 Cookie에는 HttpOnly, Secure, SameSite=Lax를 적용합니다. 운영자가 권한이 분리된 AWS 계정으로 접근합니다.</p></section>
    <section><h2>체험 계정 주의</h2><p>“로그인 없이 둘러보기”는 하나의 공유 계정입니다. 모든 방문자가 기록을 보고 쓸 수 있으므로 개인적인 수치를 입력하지 마세요. 공유 계정은 방문자가 삭제할 수 없습니다.</p></section>
    <section><h2>계정과 기록 삭제</h2><p>소셜 로그인 후 사용자 메뉴의 “내 데이터 삭제”를 선택하고 확인하면 본인의 체크인과 추천, AI 코멘트, 주간 리포트, 생성 시도 기록과 계정을 함께 삭제하고 로그인 상태를 종료합니다. 삭제는 되돌릴 수 없습니다. 다시 로그인하면 이전 기록이 없는 새 계정으로 시작합니다. 백업(14일)과 접속 로그(30일)는 각 보관 기간까지 남을 수 있습니다.</p></section>
    <section><h2>문의</h2><p><a href="https://github.com/youneedpython/MoodFit-v3/issues" target="_blank" rel="noopener noreferrer">GitHub Issue로 문의하기 (외부 링크, 새 창)</a>. 공개 문의에는 건강 수치나 개인 인증 정보를 올리지 마세요.</p></section>
    <Link to="/login">로그인 화면으로</Link>
  </article>;
}
