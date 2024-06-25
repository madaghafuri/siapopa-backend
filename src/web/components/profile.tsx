export type AuthenticatedUser = {
  id: number;
  email: string;
  phone: string;
  name: string;
  photo: string;
  validasi: boolean;
  usergroup_id?: number;
  userGroup?: {
    id: number;
    group_name: string;
  };
};

const Profile = ({ user }: { user: AuthenticatedUser }) => {
  return (
    <div
      _="on click toggle between .hidden and .flex on #dropdown-menu"
      class="relative"
    >
      <div class="grid grid-cols-4 items-center justify-between gap-5 rounded-lg border px-4 py-2">
        <div>{user.photo || <i class="fa-solid fa-user"></i>}</div>
        <div>
          <h4 class="font-bold">{user.name}</h4>
          <h5 class="text-xs">{user.userGroup?.group_name || "Guest"}</h5>
        </div>
        <i class="fa-solid fa-caret-down col-start-4"></i>
      </div>
      <div
        id="dropdown-menu"
        class="absolute z-auto hidden rounded-lg border bg-white p-5"
      >
        Hihi
      </div>
    </div>
  );
};

export default Profile;
