import { useEffect } from "react";
import { Link } from "react-router";

// 디자이너가 제공한 정적 랜딩(khux-apply-landing.html)을 최대한 그대로 이식.
// 전역 스타일과 충돌하지 않도록 .khux-landing 스코프 아래에 원본 CSS를 유지.
const LANDING_STYLES = `
.khux-landing{
  --bg: var(--background);
  --card: #0d1119;
  --border: var(--border);
  --border-strong: rgba(255,255,255,0.18);
  --mint: var(--primary);
  --mint-deep: #17a37d;
  --mint-dim: rgba(45,212,166,0.12);
  --text-1: var(--foreground);
  --text-2: #98A3A8;
  --text-3: #565F66;
  position:relative;
  background:var(--bg);
  color:var(--text-1);
  font-family:'Pretendard Variable', -apple-system, BlinkMacSystemFont, sans-serif;
  line-height:1.6;
  overflow-x:hidden;
}
.khux-landing *{box-sizing:border-box; margin:0; padding:0;}
.khux-landing::before{
  content:'';
  position:fixed;
  top:-220px; left:-220px;
  width:640px; height:640px;
  background:radial-gradient(circle, rgba(45,212,166,0.11), transparent 70%);
  pointer-events:none;
  z-index:0;
}
.khux-landing .mono{font-family:'IBM Plex Mono', monospace;}
.khux-landing .wrap{max-width:960px; margin:0 auto; padding:0 32px;}
.khux-landing .wrap-wide{max-width:1180px; margin:0 auto; padding:0 32px;}
.khux-landing a{color:inherit; text-decoration:none;}
.khux-landing em{font-style:normal; color:var(--mint);}

.khux-landing .track{
  position:absolute;
  left:50%;
  top:0;
  bottom:0;
  width:1px;
  background:linear-gradient(to bottom, transparent, rgba(45,212,166,0.25) 8%, rgba(45,212,166,0.25) 92%, transparent);
  transform:translateX(-480px);
  z-index:0;
}
@media (max-width:1240px){ .khux-landing .track{display:none;} }

.khux-landing .root-mark{
  position:absolute;
  left:50%;
  transform:translate(-481px,-50%);
  width:9px; height:9px;
  border-radius:50%;
  background:var(--bg);
  border:1.5px solid var(--mint);
  opacity:0;
  transition:opacity .6s ease, transform .6s ease;
  z-index:1;
}
.khux-landing .root-mark::before{
  content:'';
  position:absolute;
  left:50%; top:50%;
  width:16px; height:1px;
  background:var(--mint);
  transform:translate(0,-50%);
  opacity:.5;
}
.khux-landing .in-view .root-mark{ opacity:1; }
@media (max-width:1240px){ .khux-landing .root-mark{display:none;} }

.khux-landing section{ position:relative; z-index:1; }

/* HERO */
.khux-landing .hero{
  padding:96px 0 64px;
  overflow:hidden;
}
.khux-landing .eyebrow-tag{
  display:inline-flex; align-items:center; gap:8px;
  font-size:12px;
  letter-spacing:.08em;
  color:var(--mint);
  margin-bottom:28px;
}
.khux-landing .eyebrow-tag::before{
  content:'';
  width:6px; height:6px;
  border-radius:50%;
  background:var(--mint);
  box-shadow:0 0 10px var(--mint);
}
.khux-landing .hero-grid{
  display:grid;
  grid-template-columns:1.05fr 0.95fr;
  gap:24px;
  align-items:center;
}
.khux-landing .hero-title{
  font-size:58px;
  font-weight:800;
  letter-spacing:-0.02em;
  line-height:1.18;
  color:var(--text-1);
}
.khux-landing .hero-org{
  margin-top:22px;
  font-size:17px;
  font-weight:500;
  color:var(--text-1);
}
.khux-landing .hero-date{
  margin-top:10px;
  font-size:13px;
  color:var(--text-3);
}
.khux-landing .hero-visual{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:280px;
}
.khux-landing .hero-visual::before{
  content:'';
  position:absolute;
  inset:-10%;
  background:radial-gradient(circle, rgba(45,212,166,0.22), transparent 65%);
  filter:blur(30px);
}
.khux-landing .hero-visual img{
  position:relative;
  width:100%;
  max-width:440px;
  filter:drop-shadow(0 30px 60px rgba(45,212,166,0.2));
}
@media (max-width:860px){
  .khux-landing .hero-grid{grid-template-columns:1fr; text-align:center;}
  .khux-landing .hero-title{font-size:42px;}
  .khux-landing .eyebrow-tag{justify-content:center;}
  .khux-landing .hero-visual{order:-1; min-height:200px;}
  .khux-landing .hero-visual img{max-width:260px;}
}

.khux-landing .hero-cta{
  display:flex;
  justify-content:flex-start;
  gap:12px;
  margin-top:40px;
  flex-wrap:wrap;
}
@media (max-width:860px){ .khux-landing .hero-cta{justify-content:center;} }
.khux-landing .btn-primary{
  background:var(--mint);
  color:#06231b;
  font-weight:700;
  font-size:15px;
  padding:14px 28px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  gap:8px;
  transition:transform .15s ease, background .15s ease;
}
.khux-landing .btn-primary:hover{ background:#3fe6b8; transform:translateY(-1px); }
.khux-landing .btn-ghost{
  border:1px solid var(--border-strong);
  color:var(--text-1);
  font-weight:600;
  font-size:15px;
  padding:14px 24px;
  border-radius:999px;
  transition:border-color .15s ease, background .15s ease;
}
.khux-landing .btn-ghost:hover{ border-color:var(--mint); background:var(--mint-dim); }

.khux-landing .meta-row{
  display:flex;
  justify-content:flex-start;
  gap:32px;
  margin-top:56px;
  padding-top:32px;
  border-top:1px solid var(--border);
  flex-wrap:wrap;
}
@media (max-width:860px){ .khux-landing .meta-row{justify-content:center; text-align:center;} }
.khux-landing .meta-item{ text-align:left; }
@media (max-width:860px){ .khux-landing .meta-item{text-align:center;} }
.khux-landing .meta-item .k{
  font-size:11px;
  color:var(--text-3);
  letter-spacing:.06em;
  text-transform:uppercase;
  margin-bottom:6px;
}
.khux-landing .meta-item .v{ font-size:15px; color:var(--text-1); font-weight:500; }
.khux-landing .meta-item .v .mono{ color:var(--mint); }

/* SECTION HEADER */
.khux-landing .sec-head{ margin-bottom:44px; }
.khux-landing .eyebrow{
  font-size:12px;
  letter-spacing:.08em;
  color:var(--mint);
  margin-bottom:14px;
  display:block;
}
.khux-landing .sec-head h2{
  font-size:34px;
  font-weight:800;
  letter-spacing:-0.015em;
  line-height:1.3;
  color:var(--text-1);
}
.khux-landing .sec-head p{
  margin-top:14px;
  font-size:15px;
  color:var(--text-2);
  max-width:480px;
}

.khux-landing section.pad{ padding:88px 0; }
.khux-landing section.pad + section.pad{ border-top:1px solid var(--border); }

/* WHY */
.khux-landing .why-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:1px;
  background:var(--border);
  border:1px solid var(--border);
  border-radius:16px;
  overflow:hidden;
}
.khux-landing .why-card{
  background:var(--card);
  padding:32px 28px;
}
.khux-landing .why-card .num{
  font-size:12px;
  color:var(--mint);
  margin-bottom:20px;
}
.khux-landing .why-card h3{
  font-size:18px;
  font-weight:700;
  margin-bottom:10px;
  color:var(--text-1);
}
.khux-landing .why-card p{ font-size:14px; color:var(--text-2); }
@media (max-width:760px){ .khux-landing .why-grid{grid-template-columns:1fr;} }

/* TRACKS */
.khux-landing .track-list{ display:flex; flex-direction:column; gap:1px; background:var(--border); border:1px solid var(--border); border-radius:16px; overflow:hidden;}
.khux-landing .track-item{
  background:var(--card);
  padding:24px 28px;
  display:grid;
  grid-template-columns:180px 1fr;
  gap:24px;
  align-items:baseline;
}
.khux-landing .track-item .role{ font-size:17px; font-weight:700; color:var(--mint); }
.khux-landing .track-item .desc{ font-size:14px; color:var(--text-2); }
@media (max-width:640px){ .khux-landing .track-item{grid-template-columns:1fr; gap:6px;} }

/* PROCESS */
.khux-landing .process-list{ display:flex; flex-direction:column; }
.khux-landing .proc-item{
  display:grid;
  grid-template-columns:88px 1fr 140px;
  gap:20px;
  align-items:center;
  padding:22px 0;
  border-top:1px solid var(--border);
}
.khux-landing .proc-item:last-child{ border-bottom:1px solid var(--border); }
.khux-landing .proc-item .step{ font-size:12px; color:var(--mint); }
.khux-landing .proc-item h4{ font-size:16px; font-weight:700; color:var(--text-1); }
.khux-landing .proc-item .when{ font-size:13px; color:var(--text-2); text-align:right; }
@media (max-width:640px){
  .khux-landing .proc-item{grid-template-columns:1fr; text-align:left; gap:4px;}
  .khux-landing .proc-item .when{ text-align:left; }
}

/* FAQ */
.khux-landing details{
  border-top:1px solid var(--border);
  padding:20px 0;
}
.khux-landing details:last-child{ border-bottom:1px solid var(--border); }
.khux-landing summary{
  cursor:pointer;
  list-style:none;
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:16px;
  font-weight:600;
  color:var(--text-1);
}
.khux-landing summary::-webkit-details-marker{ display:none; }
.khux-landing summary::after{
  content:'+';
  font-size:20px;
  color:var(--mint);
  font-weight:400;
  transition:transform .2s ease;
}
.khux-landing details[open] summary::after{ transform:rotate(45deg); }
.khux-landing details p{
  margin-top:14px;
  font-size:14px;
  color:var(--text-2);
  max-width:600px;
}

/* FINAL CTA */
.khux-landing .final{
  text-align:center;
  padding:120px 0 140px;
  overflow:hidden;
  position:relative;
}
.khux-landing .final::before{
  content:'';
  position:absolute;
  left:50%; top:50%;
  width:900px; height:900px;
  transform:translate(-50%,-50%);
  background:radial-gradient(circle, rgba(45,212,166,0.10), transparent 65%);
  pointer-events:none;
}
.khux-landing .final-mark{
  position:absolute;
  left:50%; top:50%;
  width:520px;
  transform:translate(-50%,-50%) rotate(-8deg);
  opacity:0.05;
  pointer-events:none;
}
.khux-landing .final h2{
  font-size:46px;
  font-weight:800;
  letter-spacing:-0.02em;
  line-height:1.25;
  margin-bottom:36px;
  position:relative;
}
.khux-landing .deadline{
  font-size:13px;
  color:var(--text-3);
  margin-top:24px;
  position:relative;
}
.khux-landing .deadline .mono{ color:var(--mint); }

.khux-landing .reveal{
  opacity:0;
  transform:translateY(16px);
  transition:opacity .6s ease, transform .6s ease;
}
.khux-landing .in-view .reveal{ opacity:1; transform:translateY(0); }

.khux-landing .hero .reveal{ opacity:1; transform:none; }
`;

export function RecruitLanding() {
  useEffect(() => {
    const items = document.querySelectorAll("[data-observe]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="khux-landing">
      <style>{LANDING_STYLES}</style>

      <div className="track" />

      <section className="hero">
        <div className="wrap-wide">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow-tag mono">KHUX 4th Recruiting</span>
              <h1 className="hero-title">
                치열한 고민과
                <br />
                <em>밀도 있는 성장</em>
              </h1>
              <p className="hero-org">
                경희대학교 UX/HCI 학회 <em>KHUX</em>
              </p>
              <p className="hero-date mono">2026.08.12 – 2026.08.23 23:59</p>
            </div>
            <div className="hero-visual">
              <img src="/khux-mark.webp" alt="KHUX 브랜드 마크" width={628} height={628} />
            </div>
          </div>
          <div className="hero-cta">
            <a href="#apply" className="btn-primary">
              4기 지원하기 →
            </a>
            <a href="#tracks" className="btn-ghost">
              모집 분야 보기
            </a>
          </div>
          <div className="meta-row">
            <div className="meta-item">
              <div className="k mono">모집 인원</div>
              <div className="v">
                총 <span className="mono">10명</span>
              </div>
            </div>
            <div className="meta-item">
              <div className="k mono">활동 기간</div>
              <div className="v">1년 (주 1회 정기 세션)</div>
            </div>
            <div className="meta-item">
              <div className="k mono">지원 마감</div>
              <div className="v">
                <span className="mono">8.23 (일) 23:59</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">WHY KHUX</span>
            <h2>
              세 가지는 <em>분명합니다</em>
            </h2>
            <p>전공, 학년, 경험 무관하게 지원할 수 있어요.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="num mono">01</div>
              <h3>프로젝트로 배웁니다</h3>
              <p>이론 스터디보다 실제 프로젝트가 중심입니다. 문제 정의부터 프로토타입까지, 손으로 완성해봅니다.</p>
            </div>
            <div className="why-card">
              <div className="num mono">02</div>
              <h3>직군을 넘나듭니다</h3>
              <p>기획, 리서치, 디자인, 개발이 한 팀에서 붙어 일합니다. 내 역할 밖의 언어도 자연히 익히게 됩니다.</p>
            </div>
            <div className="why-card">
              <div className="num mono">03</div>
              <h3>결과로 증명합니다</h3>
              <p>발표 자료가 아니라 실제로 사용 가능한 서비스, 결과물을 남깁니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" id="tracks" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">RECRUITING TRACKS</span>
            <h2>
              3개 분야에서 <em>모집합니다</em>
            </h2>
            <p>지원서에서 희망 분야를 3지망까지 선택할 수 있어요.</p>
          </div>
          <div className="track-list">
            <div className="track-item">
              <div className="role">Education</div>
              <div className="desc">
                예비 UX 전문가들을 위해 가장 효율적인 커리큘럼을 기획하고 교육 콘텐츠를 제작합니다. 이론 학습과 실무 적용 사이의 간극을 줄일 수 있는 세션을 운영하며, 학회원들이 서로의 지식을 공유하고 함께 성장하는 학습 문화를 주도합니다.
              </div>
            </div>
            <div className="track-item">
              <div className="role">Operations</div>
              <div className="desc">
                학회의 살림을 책임지며, 구성원들이 깊은 소속감을 느끼고 시너지를 낼 수 있는 조직 문화를 만듭니다. 리크루팅부터 온보딩, 운영 관리까지 활동 전반에서 발생할 수 있는 불필요한 마찰을 줄여 매끄럽고 즐거운 활동 경험을 제공합니다.
              </div>
            </div>
            <div className="track-item">
              <div className="role">Growth</div>
              <div className="desc">
                학회의 성장에 온전히 집중하는 팀입니다. 학회를 하나의 브랜드로 정의하여 마케팅 전략을 수립하고, 적극적인 기업 파트너십 유치를 통해 외부와의 연결 고리를 만듭니다. 학회원들이 더 넓은 무대에서 활약할 수 있도록 성장의 발판을 마련합니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">PROCESS</span>
            <h2>
              지원부터 <em>합류까지</em>
            </h2>
          </div>
          <div className="process-list">
            <div className="proc-item">
              <div className="step mono">STEP 01</div>
              <h4>1차 서류 전형</h4>
              <div className="when mono">8.12 – 8.23</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 02</div>
              <h4>
                1차 전형 결과
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>개별 문자 안내</span>
              </h4>
              <div className="when mono">8.24</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 03</div>
              <h4>
                2차 면접 전형
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>비대면</span>
              </h4>
              <div className="when mono">8.26 – 8.28</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 04</div>
              <h4>
                2차 전형 결과
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>개별 문자 안내</span>
              </h4>
              <div className="when mono">8.29</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 05</div>
              <h4>
                부트캠프
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>비대면 · 필참</span>
              </h4>
              <div className="when mono">8.31</div>
            </div>
            <div className="proc-item">
              <div className="step mono">STEP 06</div>
              <h4>
                OT
                <br />
                <span style={{ fontWeight: 400, color: "var(--text-2)", fontSize: 13 }}>대면 · 필참</span>
              </h4>
              <div className="when mono">9.3</div>
            </div>
          </div>
        </div>
      </section>

      <section className="pad" data-observe>
        <div className="root-mark" />
        <div className="wrap reveal">
          <div className="sec-head">
            <span className="eyebrow mono">FAQ</span>
            <h2>
              지원 전에 <em>궁금한 것들</em>
            </h2>
          </div>
          <div>
            <details open>
              <summary>전공 무관하게 지원할 수 있나요?</summary>
              <p>네. 실제로 4기 멤버 대부분이 서로 다른 전공입니다. 대신 지원 분야에 대한 관심과, 프로젝트를 끝까지 만들어보려는 의지를 봅니다.</p>
            </details>
            <details>
              <summary>활동은 온라인인가요, 오프라인인가요?</summary>
              <p>정기 세션은 오프라인을 기본으로 하고, 팀 작업은 온오프라인을 병행합니다. 학기 중 필요에 따라 조정됩니다.</p>
            </details>
            <details>
              <summary>주당 얼마나 시간을 써야 하나요?</summary>
              <p>정기 세션 1시간 + 팀 작업 시간이 별도로 필요합니다. 프로젝트 막바지에는 그보다 더 쓰게 되는 주도 있어요.</p>
            </details>
            <details>
              <summary>디자인 툴을 다뤄본 적이 없어도 되나요?</summary>
              <p>UX/UI 디자인 트랙은 툴 사용 경험보다 문제를 어떻게 풀어가는지를 더 봅니다. 합류 후 툴 사용법은 함께 익힙니다.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="final" id="apply" data-observe>
        <img className="final-mark" src="/khux-mark.webp" alt="" role="presentation" width={628} height={628} />
        <div className="wrap reveal">
          <h2>
            지금,
            <br />
            <em>지원하세요</em>
          </h2>
          <Link to="/recruit" className="btn-primary">
            지원서 작성하기 →
          </Link>
          <div className="deadline">
            지원 마감 <span className="mono">2026.08.23 (일) 23:59</span>
          </div>
        </div>
      </section>
    </div>
  );
}
