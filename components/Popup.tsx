import { MouseEvent, ReactNode, useEffect, useRef } from "react";

interface Props {
  trigger: ReactNode;
  children: ReactNode;
}

export default function Popup({ trigger, children }: Props) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popup = popupRef.current;

  function open() {
    const trigger = triggerRef.current;

    if (!popup || !trigger) return;
    if (popup.style.maxHeight === "100vh") return;
    const { x, width, y } = trigger.getBoundingClientRect();
    popup.style.maxHeight = "100vh";
    popup.style.padding = "1rem 1rem";
    popup.style.border = "1px solid black";
    popup.style.top = y - popup.scrollHeight - 30 + "px";
    popup.style.left = x - popup.clientWidth + width + "px";
  }

  function close() {
    if (!popup) return;
    if (popup.style.maxHeight === "0px") return;
    popup.style.maxHeight = "0px";
    popup.style.padding = "0rem 1rem";
    popup.style.border = "0px solid black";
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
      )
        close();
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [popupRef]);

  return (
    <>
      <style jsx>{`
        .popup {
          transition: all 0.4s;
          overflow-y: auto;
          background: white;
          color: black;
          position: fixed;
          border: 0px solid black;
          max-height: 0px;
          min-width: 20rem;
          padding: 0rem 1rem;
          border-radius: 1rem;
        }
      `}</style>
      <div ref={triggerRef} onClick={open}>
        {trigger}
      </div>

      <div ref={popupRef} className="popup">
        {children}
        <button onClick={close}>Cancel</button>
      </div>
    </>
  );
}
