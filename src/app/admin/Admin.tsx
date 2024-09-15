import { Drawer, IconButton, Toolbar, AppBar, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { useState } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom";

import MenuIcon from '@mui/icons-material/Menu';

import AccountMenu from "@/components/AccountMenu";
import ParticipantsView from "./ParticipantssView";
import JudgesView from "./JudgesView";
import ScoreView from "./ScoreView";



function Layout() {

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{width: "100%", height: "100%"}}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={() => setDrawerOpen(val => !val)}>
            <MenuIcon />
          </IconButton>
          <div style={{ flexGrow: 1 }}>
          </div>
          <AccountMenu signOut={() => null}/>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem disablePadding>
            <Link to="score">
              <ListItemButton onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Score" />
              </ListItemButton>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link to="participants">
              <ListItemButton onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Deelnemers" />
              </ListItemButton>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link to="judges">
              <ListItemButton onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Jury" />
              </ListItemButton>
            </Link>
          </ListItem>
        </List>
      </Drawer>

      <Outlet />
    </div>
  );
}

function Login() {
  return (
    <div>
      AdminLogin  
    </div>
  )
}



export default function AdminView(){
  const [authenticated, _] = useState<boolean>(true);

  return (
    <div>
      {!authenticated && (
        <Login/>
      )}

      {authenticated && (
        <Routes>
          <Route path="" element={<Layout />} >
            <Route index element={<ScoreView />} />
            <Route path="score" element={<ScoreView />} />
            <Route path="participants" element={<ParticipantsView />} />
            <Route path="judges" element={<JudgesView />} />
            <Route path="*" element={<ParticipantsView />} />
          </Route>
        </Routes>
      )}

    </div>
  )
}