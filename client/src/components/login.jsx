export default function Login() {
  const login = async () => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    localStorage.setItem("token", data.token);
    // navigate("/", { replace: true });
    // navigate("/");
  };

  return;
}
