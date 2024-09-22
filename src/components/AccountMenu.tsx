import { useState } from "react";

import { Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import { Link } from "react-router-dom";

export default function AccountMenu({name, menuItems}: {name: string, menuItems: Array<{link: string, label: string, action: () => void}>}){
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
        <Avatar sx={{backgroundColor: "var(--AppBar-color)", color: "var(--AppBar-background)", textTransform: "capitalize"}}>{name.slice(0, 1)}</Avatar>
      </IconButton>
      <Menu anchorEl={anchorEl} anchorOrigin={{vertical: 'top', horizontal: 'right'}} keepMounted transformOrigin={{vertical: 'top', horizontal: 'right'}} open={Boolean(anchorEl)} onClose={handleClose}>
        {menuItems.map((item, index) => (
          <Link key={index} to={item.link}><MenuItem onClick={()=> {item.action(); handleClose();}}>{item.label}</MenuItem></Link>
        ))}
      </Menu>
    </div>
  )
}