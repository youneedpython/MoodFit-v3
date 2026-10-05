import { Link, NavLink, Outlet, useLocation } from "react-router";
import { UserMenu } from "../features/auth/UserMenu";
import { formatHeaderDate } from "../utils/dateTime";
import "./AppLayout.css";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/check-in", label: "Check-in", end: false },
  { to: "/history", label: "History", end: false }
];

export function AppLayout() {
  const login = ["/login", "/privacy"].includes(useLocation().pathname);
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        본문으로 건너뛰기
      </a>
      <header className="app-header">
        <div className="container app-header__inner">
          <div className="app-header__brand">
            <Link className="app-header__identity" to="/">
              <img className="app-header__mark" src="/favicon.svg" alt="" />
              <span className="app-header__logo">MoodFit</span>
            </Link>
            <span className="app-header__date">{formatHeaderDate(new Date())}</span>
          </div>
          {!login && <div className="app-header__account"><nav aria-label="주요 메뉴">
            <ul className="app-nav">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => (isActive ? "app-nav__link app-nav__link--active" : "app-nav__link")}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav><UserMenu /></div>}
        </div>
      </header>
      <main id="main-content" className="container app-main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="container app-footer">
        <p>© MoodFit · 교육용 Product Heuristic이며 의학적 조언이 아닙니다.</p>
        <Link to="/privacy">개인정보 처리 안내</Link>
      </footer>
    </div>
  );
}
