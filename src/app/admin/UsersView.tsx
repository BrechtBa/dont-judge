
import { useEffect, useState } from "react";

import { User } from "@/domain";
import { adminUseCases } from "@/factory";

import { Button, IconButton, TextField, Dialog } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PaperlistItem from "@/components/PaperListItem";


export default function UsersView() {
  const [users, setUsers] = useState<Array<User>>([]);

  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [inviteAdminDialogOpen, setInviteAdminDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    adminUseCases.useActiveContestAdmins(setUsers)
  }, []);


  return (
    <div>
      <h1>Gebruikers</h1>
      
      <div>
        {users.map(user => (
          <PaperlistItem key={user.id}>
            {user.displayName}
          </PaperlistItem>
        ))}

      </div>

      <IconButton onClick={() =>  setInviteAdminDialogOpen(true)}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <Dialog open={inviteAdminDialogOpen} onClose={() => setInviteAdminDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <h1>Nodig een admin uit</h1>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="e-mail" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
          </div>
          <div>
            <Button onClick={() => {adminUseCases.sendAdminInvitation(newUserEmail); setInviteAdminDialogOpen(false); setNewUserEmail("");}}>Verstuur</Button>
            <Button onClick={() => {setInviteAdminDialogOpen(false); setNewUserEmail("");}}>Cancel</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}