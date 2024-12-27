import { Drawer, IconButton, Toolbar, AppBar, List, ListItem, ListItemButton, ListItemText, TextField, Button, Dialog } from "@mui/material";
import { useEffect, useState } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom";

import { Contest } from "@/domain";
import { adminUseCases } from "@/factory";

import MenuIcon from '@mui/icons-material/Menu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import AccountMenu from "@/components/AccountMenu";
import PaperlistItem from "@/components/PaperListItem";

import ParticipantsView from "./ParticipantsView";
import JudgesView from "./JudgesView";
import ScoreView from "./ScoreView";
import ContestView from "./ContestView";
import UsersView from "./UsersView";


function ManageContestsDialog({open, setOpen}: {open: boolean, setOpen: (open: boolean)=>void}) {
  const [availableContests, setAvailableContests] = useState<Array<Contest>>([]);
  const [activeContestId, setActiveContestId] = useState<string>("");
  

  const refreshAvailbaleContests = () => {
    adminUseCases.getAuthenticatedUserAvailableContests().then(data => {
      setActiveContestId(data.activeContestId);
      setAvailableContests(data.contests);
    });
  }

  useEffect(() => {
    if(open) {
      refreshAvailbaleContests();
    }
  }, [open])

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <div style={{margin: "1em"}}>
        <h1>Wedstrijden</h1>

        <div>
            {availableContests.map(contest => (
              
              <PaperlistItem key={contest.id}>
                <div style={{display: "flex", alignItems: "center", padding: "0.5em", gap: "1em"}}>
                  <div style={{flexGrow: 1}}>{contest.name}</div>
                  {contest.id === activeContestId && (
                    <Button disabled style={{height: "1.5em", marginLeft: "10em"}}>actief</Button>
                  )}
                  {contest.id !== activeContestId && (
                    <div>
                      <Button color="error" onClick={()=> {adminUseCases.deleteContest(contest.id);}} style={{height: "1.5em"}}>verwijder</Button>
                      <Button onClick={()=> {adminUseCases.setActiveContest(contest.id); setOpen(false);}} style={{height: "1.5em"}}>activeer</Button>
                    </div>
                  )}
                </div>
              </PaperlistItem>
            ))}

        </div>

        <IconButton onClick={() => {adminUseCases.addContest(); refreshAvailbaleContests();}}>
          <AddCircleOutlineIcon></AddCircleOutlineIcon>
        </IconButton>

        <div>
          <Button onClick={() => {setOpen(false)}}>Cancel</Button>
        </div>
      </div>
    </Dialog>
  )
}


function Layout() {

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contestsOpen, setContestsOpen] = useState(false);

  const menuItems = [{
    to: "score",
    label: "Score"
  }, {
    to: "contest",
    label: "Wedstrijd"
  }, {
    to: "participants",
    label: "Deelnemers"
  }, {
    to: "judges",
    label: "Jury"
  }, {
    to: "users",
    label: "Gebruikers"
  }]

  return (
    <div style={{width: "100%", height: "100%"}}>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }} onClick={() => setDrawerOpen(val => !val)}>
            <MenuIcon />
          </IconButton>
          <div style={{ flexGrow: 1 }}>
          </div>
          <AccountMenu name={adminUseCases.getAuthenticatedUserEmail()} menuItems={[
            {label: "Uitloggen", link: "/", action: () => adminUseCases.signOut()},
            {label: "Wedstrijden", link: null, action: () => setContestsOpen(true)},
          ]}/>
        </Toolbar>
      </AppBar>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <List>
          {menuItems.map((item, index) => (
            <ListItem key={index} disablePadding>
              <Link to={item.to}  style={{textDecoration: 'inherit', color: 'inherit', width: "100%"}}>
                <ListItemButton onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Link>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <div style={{paddingLeft: "1em", paddingRight: "1em", overflowY: "auto", position: "absolute", top: "70px", bottom: 0, left: 0, right: 0}}>
        <Outlet />
      </div>

      <ManageContestsDialog open={contestsOpen} setOpen={setContestsOpen}/>
      
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);


  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "6em"}}>

      <h1>Admin</h1>
      <div style={{display: "flex", flexDirection: "column", gap: "1em", width: "90%", maxWidth: "20em"}}>
        { loginError !== null && (
          <div style={{fontWeight: 600, color: "#f00"}}>
            {loginError}
          </div>
        )}
        <TextField label="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <TextField label="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>

        <div>
          <Button onClick={() => adminUseCases.authenticate(email, password).then(() => {setLoginError(null)}).catch((e: Error) => setLoginError(e.message))}>login</Button>
          <Link to="/"><Button>cancel</Button></Link> 
        </div>
        
        <Link to="register">Nieuwe gebruiker?</Link> 
      </div>

    </div>
  )
}


function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");

  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "6em"}}>

      <h1>Registreren</h1>
      <div style={{display: "flex", flexDirection: "column", gap: "1em", width: "90%", maxWidth: "20em"}}>
        <TextField label="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
        <TextField label="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
        <TextField label="password herhalen" type="password" value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} error={password !== passwordRepeat}/>

        <div>
          <Button onClick={() => adminUseCases.selfSignUp(email, password)}>registreer</Button>
          <Link to=".."><Button>cancel</Button></Link> 
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
        <Routes>
          <Route path="register" element={<Register />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}

      {authenticated && (
        <Routes>
          <Route path="" element={<Layout />} >
            <Route index element={<ScoreView />} />
            <Route path="contest" element={<ContestView />} />
            <Route path="score" element={<ScoreView />} />
            <Route path="participants" element={<ParticipantsView />} />
            <Route path="judges" element={<JudgesView />} />
            <Route path="users" element={<UsersView />} />
            <Route path="*" element={<ParticipantsView />} />
          </Route>
        </Routes>
      )}

    </div>
  )
}