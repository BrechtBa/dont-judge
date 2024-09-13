import { useState } from "react";

import { AccountCircle } from "@mui/icons-material";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { Link } from "react-router-dom";

export default function AccountMenu({signOut}: {signOut: () => void}){
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton size="large" aria-label="account of current user" aria-controls="menu-appbar" aria-haspopup="true" color="inherit" onClick={handleMenu}>
        <AccountCircle />
      </IconButton>
      <Menu anchorEl={anchorEl} anchorOrigin={{vertical: 'top', horizontal: 'right'}} keepMounted transformOrigin={{vertical: 'top', horizontal: 'right'}} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={handleClose}>Profiel</MenuItem>
        <Link to="/"><MenuItem onClick={()=> {signOut(); handleClose()}}>Log out</MenuItem></Link>
      </Menu>
    </div>
  )
}