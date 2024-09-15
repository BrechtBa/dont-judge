import { Drawer, IconButton, Toolbar, AppBar, List, ListItem, ListItemButton, ListItemText, Paper, Dialog, Button, TextField, Select, MenuItem } from "@mui/material";
import { useEffect, useState } from "react"
import { Link, Outlet, Route, Routes } from "react-router-dom";
import MenuIcon from '@mui/icons-material/Menu';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import QrCodeIcon from "@mui/icons-material/QrCode";

import AccountMenu from "@/components/AccountMenu";

import { adminUseCases } from "@/factory";
import { Category, Judge, Participant } from "@/domain";
import QRCode from "react-qr-code";



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

function ScoreView() {
  return (
    <div>
      Score
    </div>
  );
}

function ParticipantsView() {
  const [participants, setParticipants] = useState<Array<Participant>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [editParticipantDialogOpen, setEditParticipantDialogOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant|null>(null);


  useEffect(() => {
    adminUseCases.useParticipants((val) => setParticipants(val));
  }, [])

  useEffect(() => {
    adminUseCases.useCategories((val) => setCategories(val));
  }, [])

  const categoriesMap: {[key: string]: Category} = categories.reduce((accumulator, val) => ({...accumulator, [val.id]: val}), {})

  const saveParticipant = () => {
    if(editParticipant === null) {
      return
    }

    if( editParticipant.id === "" ){
      // new participant
      if(editParticipant.category === undefined){
        return
      }

      adminUseCases.addParticipant(editParticipant.name, editParticipant.category);
      return
    }

    adminUseCases.storeParticipant(editParticipant)

  }

  return (
    <div>
      <h1>Deelnemers</h1>

      <div>
        {participants.map(participant => (
          <div key={participant.id}>
            <Paper onClick={() => {setEditParticipant(participant); setEditParticipantDialogOpen(true)}}>
              <div style={{display: "flex", flexDirection: "row", margin: "1em"}}>
                <div>
                  {participant.name}
                </div>
                <div style={{flexGrow: 1}}></div>
                <div>
                  {participant.category === undefined ? "" : participant.category.name}
                </div>
              </div>
            </Paper>
          </div>
        ))}
      </div>

      <IconButton onClick={()=> {setEditParticipant({id: "", name: "", category: categories[0]}); setEditParticipantDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <Dialog open={editParticipantDialogOpen} onClose={()=> setEditParticipantDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editParticipant===null ? "" : editParticipant.name} onChange={(e) => setEditParticipant(val => (val===null ? null : {...val, name: e.target.value}))}/>
            
            <Select label="Category" value={editParticipant===null ? undefined : editParticipant.category?.id} onChange={(e)=> setEditParticipant(val => (val===null ? null : {...val, category: categoriesMap[e.target.value]}))} >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          
          </div>
          <div>
            <Button onClick={() => {saveParticipant(); setEditParticipantDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditParticipantDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>

    </div>
  );
}

function JudgesView(){

  const [judges, setJudges] = useState<Array<Judge>>([]);
  const [editJudgeDialogOpen, setEditJudgeDialogOpen] = useState(false);
  const [editJudge, setEditJudge] = useState<Judge|null>(null);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrJudge, setQrJudge] = useState<Judge|null>(null);
  const [qrData, setQrData] = useState("");



  useEffect(() => {
    adminUseCases.useJudges((val) => setJudges(val));
  }, [])

  useEffect(() => {
    if(qrJudge === null) {
      setQrData("");
      return
    }
    adminUseCases.useJudgeQrCodeData(qrJudge, (val) => {
      setQrData(val)
    });
  }, [qrJudge])


  const saveJudge = () => {
    if(editJudge === null) {
      return
    }

    if( editJudge.id === "" ){
      // new participant
      adminUseCases.addJudge(editJudge.name);
      return
    }
    adminUseCases.storeJudge(editJudge)
  }

  const closeQrDialog = () => {
    setQrJudge(null)
    setQrDialogOpen(false);
  } 

  return (
    <div>
      <h1>Juryleden</h1>


      <div>
        {judges.map(judge => (
          <div key={judge.id}>
            <Paper onClick={() => {setEditJudge(judge); setEditJudgeDialogOpen(true)}}>
              <div style={{display: "flex", flexDirection: "row", margin: "1em"}}>
                <div>
                  {judge.name}
                </div>
                <div style={{flexGrow: 1}}></div>
                <div>
                  <IconButton onClick={(e)=> {e.stopPropagation(); setQrJudge(judge); setQrDialogOpen(true)}}>
                    <QrCodeIcon ></QrCodeIcon>
                  </IconButton>
                </div>
              </div>
            </Paper>
          </div>
        ))}
      </div>

      <IconButton onClick={()=> {setEditJudge({id: "", name: ""}); setEditJudgeDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <Dialog open={editJudgeDialogOpen} onClose={()=> setEditJudgeDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editJudge===null ? "" : editJudge.name} onChange={(e) => setEditJudge(val => (val===null ? null : {...val, name: e.target.value}))}/>
          </div>
          <div>
            <Button onClick={() => {saveJudge(); setEditJudgeDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditJudgeDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={qrDialogOpen} onClose={closeQrDialog}>
        {qrJudge !== null && (
          <div style={{margin: "1em"}}>
            <div>
              {qrJudge.name}
            </div>
            <QRCode value={qrData} style={{maxWidth: "160px", width: "100%", height: "auto"}}/>

            <div>
              <Button onClick={closeQrDialog}>close</Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
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