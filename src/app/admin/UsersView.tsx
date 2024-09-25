
import { useEffect, useState } from "react";

import { User } from "@/domain";
import { adminUseCases } from "@/factory";

export default function UsersView() {
  const [users, setUsers] = useState<Array<User>>([]);

  useEffect(() => {
    adminUseCases.useActiveContestAdmins(setUsers)
  }, []);


  return (
    <div>
      <h1>Gebruikers</h1>
      
      <div>
        {users.map(user => (
          <div key={user.id}>
            {user.id}
          </div>
        ))}

      </div>

    </div>
  );
}
