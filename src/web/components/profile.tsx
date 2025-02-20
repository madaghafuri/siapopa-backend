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
      _="on click toggle between .hidden and .flex on #dropdown-menu then toggle .rotate-90 on #icon-down"
      class="py-3"
    >
      <div class="flex items-center justify-between gap-5 rounded-lg border px-4 py-2">
        {user.photo ? (
          <img alt="" src={user.photo} />
        ) : (
          <i class="fa-solid fa-user rounded-full border border-gray-200 p-5 text-gray-400"></i>
        )}
        <div>
          <h4 class="font-bold">{user.name}</h4>
          <h5 class="text-xs uppercase">
            {user.userGroup?.group_name || 'Guest'}
          </h5>
        </div>
        <i id="icon-down" class="fa-solid fa-caret-right"></i>
      </div>
      <div
        id="dropdown-menu"
        class="absolute z-auto hidden rounded-lg border bg-white"
      >
        <button
          class="rounded-lg px-2 py-1 hover:bg-slate-500 hover:text-white"
          type="button"
          hx-post="/logout"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
