import { getUsers } from "@/app/admin/actions";
import { UserList } from "./UserList";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <UserList users={users} />
    </div>
  );
}
