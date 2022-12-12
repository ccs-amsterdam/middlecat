import useMiddlecat from "middlecat-react";
import { useEffect, useState } from "react";

export default function Demo() {
  const { user, AuthForm } = useMiddlecat({ storeToken: true });
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
      <div className="Container">
        <AuthForm resourceSuggestion="https://middlecat.up.railway.app/api/demo_resource" />
        <div style={{ color: "grey", textAlign: "center" }}>
          <p>{msg}</p>
          <p style={{ fontSize: "1.2rem" }}>
            {msg &&
              "token is automatically refreshed about 10 seconds before it expires"}
          </p>
        </div>
      </div>
    </div>
  );
}
