import { Mail, Phone, UserCog, UsersRound } from 'lucide-react';

export type UserListItem = {
  id: number;
  employeeId?: string | null;
  idNumber?: string | null;
  name: string;
  email?: string | null;
  username?: string | null;
  avatar?: string | null;
  position?: string | null;
  employmentStatus?: string | null;
  portalStatus?: string | null;
  division?: string | null;
  section?: string | null;
  areaOfAssignment?: string | null;
  contactNumber?: string | null;
  lastLogin?: string | null;
};

type UsersViewProps = {
  users: UserListItem[];
};

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function UsersView({ users }: UsersViewProps) {
  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-5">
      <div className="rounded-md border border-border bg-card p-4 shadow-sm dark:border-border dark:bg-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-accent text-primary dark:bg-accent dark:text-accent-foreground">
              <UsersRound className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-normal">Users</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-muted-foreground">
              View SSO users synced with Caraga Portal employee information.
            </p>
          </div>
          <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm dark:border-border dark:bg-card">
            <div className="text-xs text-muted-foreground">Total users</div>
            <div className="mt-1 text-2xl font-semibold">{users.length}</div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-border p-4 dark:border-border">
          <h3 className="text-sm font-semibold">User List</h3>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground dark:bg-card dark:text-accent-foreground">
              <tr>
                <th className="w-[28%] px-4 py-3 font-medium">User</th>
                <th className="w-[18%] px-4 py-3 font-medium">Employee ID</th>
                <th className="w-[22%] px-4 py-3 font-medium">Position</th>
                <th className="w-[22%] px-4 py-3 font-medium">Office</th>
                <th className="w-[10%] px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-secondary/50 dark:border-border dark:hover:bg-secondary">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img alt={user.name} className="h-10 w-10 rounded-full object-cover" src={user.avatar} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-primary text-center text-xs font-bold leading-10 text-primary-foreground">
                          {initials(user.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{user.name}</div>
                        <div className="truncate text-xs text-muted-foreground">@{user.username ?? 'no-username'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.employeeId ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{user.idNumber ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.position ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{user.employmentStatus ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.division ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">{user.section ?? user.areaOfAssignment ?? '-'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex h-7 items-center rounded border border-emerald-500 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-800">
                      {user.portalStatus ?? 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border dark:divide-border xl:hidden">
          {users.map((user) => (
            <article key={user.id} className="p-4">
              <div className="flex items-start gap-3">
                {user.avatar ? (
                  <img alt={user.name} className="h-11 w-11 rounded-full object-cover" src={user.avatar} />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-primary text-center text-xs font-bold leading-[2.75rem] text-primary-foreground">
                    {initials(user.name)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.position ?? 'No position recorded'}</div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-2"><UserCog className="h-3.5 w-3.5" /> {user.username ?? '-'}</span>
                    <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {user.email ?? '-'}</span>
                    <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {user.contactNumber ?? '-'}</span>
                    <span>{user.division ?? user.areaOfAssignment ?? '-'}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!users.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No users have been synced yet. Users will appear here after successful SSO login.
          </div>
        ) : null}
      </div>
    </section>
  );
}
