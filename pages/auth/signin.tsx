import { GetServerSideProps } from "next";
import {
  ClientSafeProvider,
  getCsrfToken,
  getProviders,
  signIn,
  useSession,
} from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { FaEnvelope, FaGithub, FaGoogle } from "react-icons/fa";

const logos: any = {
  GitHub: <FaGithub />,
  Google: <FaGoogle />,
};

interface Props {
  providers: Record<any, ClientSafeProvider>;
  csrfToken: string | undefined;
}

export default function SignIn({ providers, csrfToken }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (session && router.query.callbackUrl) {
      const p = router.query.callbackUrl;
      const url = Array.isArray(p) ? p[0] : p;
      router.push(url);
    }
  }, [status, session, router]);

  if (status !== "loading" && session) return null;

  return (
    <div className="Container">
      <div>
        {status === "loading" ? (
          <div className="Loader" />
        ) : (
          <Providers providers={providers} csrfToken={csrfToken} />
        )}
      </div>
    </div>
  );
}

function Providers({ providers, csrfToken }: Props) {
  if (!csrfToken) return null;

  return (
    <>
      <span>Connect via</span>
      {Object.values(providers).map((provider: ClientSafeProvider) => {
        if (provider.type === "email") return null;
        return (
          <div className="Provider" key={provider.name}>
            <button onClick={() => signIn(provider.id)}>
              <div className="Logo">{logos[provider.name]}</div>
              {provider.name}
            </button>
          </div>
        );
      })}
      {providers.email && Object.values(providers).length > 1 && (
        <div className="Divider">
          <div>OR</div>
        </div>
      )}
      {providers.email && <EmailLogin csrfToken={csrfToken} />}
    </>
  );
}

function EmailLogin({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();

  return (
    <form
      key="passwordform"
      className="PasswordForm"
      method="post"
      action="/api/auth/signin/email"
    >
      <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
      <div className="EmailInput">
        <FaEnvelope />
        <input
          type="email"
          id="email"
          name="email"
          placeholder="example@email.com"
        />
      </div>
      <button type="submit">Sign in with Email</button>
    </form>
  );
}

export async function getServerSideProps(context: any) {
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: { providers, csrfToken },
  };
}
