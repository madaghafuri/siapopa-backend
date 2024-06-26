import { MainLayout } from "../layouts/main-layout.js";

const LoginPage = () => {
  return (
    <MainLayout>
      <div class="absolute inset-0 m-auto max-h-[30rem] max-w-[30rem] rounded-md border px-20 py-10 shadow-2xl">
        <h1 class="text-white">SIAPOP Login</h1>
        <form
          hx-post="/login"
          hx-target="#error-result"
          hx-swap="innerHTML"
          hx-trigger="submit"
          class="flex flex-col gap-5"
        >
          <div class="flex flex-col gap-3">
            <label>Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              class="rounded border p-2"
              name="email"
              required
            />
          </div>
          <div class="flex flex-col gap-3">
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              class="rounded border p-2"
            />
          </div>
          <div class="flex gap-3">
            <input type="checkbox" class="rounded border p-2" />
            <label>Remember me</label>
          </div>
          <div id="error-result"></div>
          <button type="submit" class="rounded bg-primary px-2 py-1 text-white">
            Log in
          </button>
          <p>
            Don't have an account?{" "}
            <a href="/register" class="text-indigo-500 underline">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </MainLayout>
  );
};

export default LoginPage;
