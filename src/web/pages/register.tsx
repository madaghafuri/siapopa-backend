import { MainLayout } from "../layouts/main-layout";

const RegisterPage = () => {
  return (
    <MainLayout>
      <div class="absolute inset-0 m-auto max-h-[30rem] max-w-[30rem] rounded-md border px-20 py-10 shadow-2xl">
        <h1 class="text-white">SIAPOP Login</h1>
        <form action="/login" class="flex flex-col gap-5">
          <div class="flex flex-col gap-3">
            <label htmlFor="">Email</label>
            <input
              type="email"
              placeholder="example@email.com"
              class="rounded border p-2"
              required
            />
          </div>
          <div class="flex flex-col gap-3">
            <label htmlFor="">Password</label>
            <input type="password" required class="rounded border p-2" />
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default RegisterPage;
