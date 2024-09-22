import { Drawer, IconButton, Toolbar, AppBar, List, ListItem, ListItemButton, ListItemText, TextField, Button } from "@mui/material";
import { useEffect, useState } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom";

import MenuIcon from '@mui/icons-material/Menu';

import AccountMenu from "@/components/AccountMenu";
import ParticipantsView from "./ParticipantsView";
import JudgesView from "./JudgesView";
import ScoreView from "./ScoreView";
import ContestView from "./ContestView";
import { adminUseCases } from "@/factory";



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
          <AccountMenu name={adminUseCases.getAuthenticatedUserEmail()} menuItems={[{label: "Uitloggen", link: "/", action: () => adminUseCases.signOut()}]}/>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          <ListItem disablePadding>
            <Link to="contest">
              <ListItemButton onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Wedstrijd" />
              </ListItemButton>
            </Link>
          </ListItem>
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

      <div style={{paddingLeft: "1em", paddingRight: "1em", overflowY: "auto", position: "absolute", top: "70px", bottom: 0, left: 0, right: 0}}>
        <Outlet />
      </div>

    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "6em"}}>

      <h1>Admin</h1>
      <div style={{display: "flex", flexDirection: "column", gap: "1em", width: "90%", maxWidth: "20em"}}>
        <TextField label="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <TextField label="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>

        <div>
          <Button onClick={() => adminUseCases.authenticate(email, password)}>login</Button>
          <Link to="/"><Button>cancel</Button></Link> 
        </div>
        
      </div>

    </div>
  )
}


export default function AdminView(){
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    adminUseCases.useIsAuthenticated((val) => setAuthenticated(val));
  }, [])

  return (
    <div>
      {!authenticated && (
        <Login/>
      )}

      {authenticated && (
        <Routes>
          <Route path="" element={<Layout />} >
            <Route index element={<ScoreView />} />
            <Route path="contest" element={<ContestView />} />
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