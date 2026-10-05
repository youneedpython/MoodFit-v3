import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/Button/Button";
import { requestInstall, useInstall } from "./installStore";
import "../auth/auth.css";

export function InstallAppButton({ menu = false, onPrompt }: { menu?: boolean; onPrompt?: () => void }) {
  const { state, busy } = useInstall();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setOpen(false); }, []);
  if (state === "installed" || state === "unavailable") return null;
  function install() {
    if (state === "ios") setOpen(true);
    else { void requestInstall(); onPrompt?.(); }
  }
  return <>
    {menu ? <button ref={trigger} role="menuitem" disabled={busy} onClick={install}>앱 설치</button> :
      <Button ref={trigger} className="app-footer__install" variant="secondary" disabled={busy} onClick={install}>앱 설치</Button>}
    {open && <InstallInstructions onClose={close} returnFocus={() => trigger.current?.focus()} />}
  </>;
}

function InstallInstructions({ onClose, returnFocus }: { onClose: () => void; returnFocus: () => void }) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const title = useId();
  const restore = useRef(returnFocus);
  useEffect(() => {
    closeButton.current?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key === "Tab") { event.preventDefault(); closeButton.current?.focus(); }
    };
    const contain = () => { closeButton.current?.focus(); };
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("focusin", contain);
    return () => {
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("focusin", contain);
      restore.current();
    };
  }, [onClose]);
  return createPortal(<div className="account-dialog-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="account-dialog" role="dialog" aria-modal="true" aria-labelledby={title}>
      <h2 id={title}>홈 화면에 추가</h2>
      <ol>
        <li>Safari 아래쪽(iPad는 위쪽)의 <strong>공유</strong> 버튼을 누릅니다.</li>
        <li><strong>"홈 화면에 추가"</strong>를 누릅니다.</li>
        <li>오른쪽 위의 <strong>"추가"</strong>를 누릅니다.</li>
      </ol>
      <p>Safari가 아닌 Browser에서는 공유 메뉴의 위치가 다를 수 있습니다.</p>
      <div className="account-dialog-actions"><Button ref={closeButton} variant="secondary" onClick={onClose}>닫기</Button></div>
    </div>
  </div>, document.body);
}
