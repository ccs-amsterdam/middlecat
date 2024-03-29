import { useMiddlecat, AuthForm, MiddlecatProvider } from "middlecat-react";
import { useEffect, useState } from "react";

export default function Demo() {
  return (
    <MiddlecatProvider bff="/api/bffAuth">
      <DemoComponent />
    </MiddlecatProvider>
  );
}

function DemoComponent() {
  const { user } = useMiddlecat();
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user?.api) {
      setMsg("");
      return;
    }
    const timer = setInterval(async () => {
      try {
        const res = await user.api.post("test");
        setMsg(res.data);
      } catch (e) {
        setMsg(`Could not validate token`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <div className="Page">
      <div className="Container" style={{ fontSize: "1rem" }}>
        <AuthForm resourceSuggestion="https://middlecat.up.railway.app/api/demo_resource" />
        <div style={{ color: "grey", textAlign: "center" }}>
          <p>{msg || "..."}</p>
          <p style={{ fontSize: "1.2em" }}>
            {msg &&
              msg !== "Unauthenticated" &&
              "token is automatically refreshed about 10 seconds before it expires"}
          </p>
        </div>
      </div>
    </div>
  );
}
