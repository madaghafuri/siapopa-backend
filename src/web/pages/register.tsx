import { MainLayout } from "../layouts/main-layout.js";

const RegisterPage = () => {
  return (
    <MainLayout>
      <div class="absolute inset-0 m-auto max-h-[30rem] max-w-[30rem] rounded-md border px-20 py-10 shadow-2xl">
        <h1 class="text-white">SIAPOP Login</h1>
        <form hx-post="/register" class="flex flex-col gap-5">
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
            <label>Username</label>
            <input
              type="text"
              class="rounded border p-2"
              name="name"
              required
            />
          </div>
          <div class="flex flex-col gap-3">
            <label htmlFor="input-password" for="input-password">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="input-password"
              required
              class="rounded border p-2"
            />
          </div>
          <div class="flex flex-col gap-3">
            <label>Confirm Password</label>
            <p id="pass-message" class="hidden text-sm text-red-500">
              password berbeda
            </p>
            <input
              type="password"
              required
              class="rounded border p-2"
              _="on every change wait for 500ms then if value of #input-password != value of me remove .hidden from #pass-message else add .hidden to #pass-message end"
            />
          </div>
          <button type="submit" class="rounded bg-primary">
            Sign Up
          </button>
        </form>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
