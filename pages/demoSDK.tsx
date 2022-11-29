import useMiddlecat from "../sdk/useMiddlecat";

export default function demoSDK() {
  const [user, setUser] = useMiddlecat("http://amcat.nl");

  return <div>{user?.email}</div>;
}
