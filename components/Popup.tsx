import { CSSProperties, MouseEvent, ReactNode, useEffect, useRef } from "react";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

export default function Popup({ trigger, children, style }: Props) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const isOpen = useRef(false);
  console.log(isOpen.current);
  function open() {
    const popup = popupRef.current as any;
    const trigger = triggerRef.current as any;
    console.log(isOpen.current);
    if (!popup || !trigger) return;
    if (isOpen.current) return;
    const { x, width, y } = trigger.getBoundingClientRect();
    popup.style["max-height"] = "100vh";
    popup.style.padding = "1rem 1rem";
    popup.style.border = "1px solid black";
    popup.style.top = y - popup.scrollHeight - 30 + "px";
    popup.style.left = x - popup.clientWidth + width + "px";
    popup.style.opacity = 1;
    popup.style.background = "white";
    isOpen.current = true;
  }

  function close() {
    const popup = popupRef.current as any;
    if (!popup) return;
    if (!isOpen.current) return;
    popup.style["max-height"] = "0px";
    popup.style.padding = "0rem 1rem";
    popup.style.border = "0px solid black";
    popup.style.opacity = 0;
    popup.style.background = "var(--primary)";
    isOpen.current = false;
  }

  useEffect(() => {
    function onClick(e: any) {
      const trigger = triggerRef.current;
      const popup = popupRef.current;
      if (
        popup &&
        trigger &&
        !popup.contains(e.target) &&
        !trigger.contains(e.target)
      ) {
        close();
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [popupRef]);

  return (
    <div
      style={style || { flex: "1 1 auto" }}
      ref={triggerRef}
      onClick={() => (isOpen.current ? close() : open())}
    >
      <style jsx>{`
        .popup {
          transition: all 0.4s, opacity 0.8s;
          overflow-y: auto;
          background: var(--primary);
          color: black;
          position: fixed;
          border: 0px solid black;
          max-height: 0px;
          min-width: 20rem;
          padding: 0rem 1rem;
          border-radius: 1rem;
          opacity: 0;
        }
        .cancel {
          margin-top: 0.5rem;
        }
      `}</style>
      {trigger}
      <div ref={popupRef} className="popup">
        {children}

        <button
          className="cancel"
          onClick={(e: any) => {
            e.stopPropagation();
            close();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
