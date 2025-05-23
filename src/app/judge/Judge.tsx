import { useEffect, useState } from "react"

import { Link, Outlet, Route, Routes, useSearchParams } from "react-router-dom";
import { AppBar, Button, Dialog, TextField, Toolbar } from "@mui/material";

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

import AccountMenu from "@/components/AccountMenu";

import JudgeParticipantView from "./JudgeParticipantView";
import SelectParticipantView from "./SelectParticipantView";

import { judgeUseCases } from "@/factory";
import { Contest, Judge } from "@/domain";


function Layout() {
  const authenticatedJudge = judgeUseCases.getAuthenticatedJudge();

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editJudge, setEditJudge] = useState<Judge | null>(authenticatedJudge);

  return (
    <div style={{width: "100%", height: "100%"}}>
      <AppBar position="static">
        <Toolbar>
          <div style={{ flexGrow: 1 }}>
          </div>
          <AccountMenu name={authenticatedJudge === null ? "" : authenticatedJudge.name} menuItems={[{label: "Profiel", link: null, action: () => setProfileDialogOpen(true)}, {label: "Uitloggen", link: "/", action: () => judgeUseCases.signOut()}]}/>
        </Toolbar>
      </AppBar>

      <div style={{paddingLeft: "1em", paddingRight: "1em", overflowY: "auto", position: "absolute", top: "70px", bottom: 0, left: 0, right: 0}}>
        <Outlet />
      </div>


      <Dialog open={profileDialogOpen} onClose={()=>setProfileDialogOpen(false)}>
        {editJudge !== null &&(
          <div style={{margin: "1em"}}>
            <h1>Profiel</h1>
            <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            
              
                <TextField label="naam" value={editJudge.name} onChange={e => setEditJudge(val => val===null ? null : ({...val, name: e.target.value}))}/>

            </div>
            <div>
              <Button onClick={() => {judgeUseCases.updateProfile(editJudge); setProfileDialogOpen(false)}}>save</Button>
              <Button onClick={() => setProfileDialogOpen(false)}>cancel</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

function Login() {
  const [searchParams] = useSearchParams();
  const [contestId, setContestId] = useState<string>("");  
  const [judgeId, setJudgeId] = useState<string>("");
  const [key, setKey] = useState<string>("");

  const handleQRResult = (data: Array<IDetectedBarcode>) => {
    judgeUseCases.authenticateWithQrData(data[0].rawValue);
  }

  const queryData = searchParams.get("key");
  if (queryData !== null) {
    judgeUseCases.authenticateWithQrData(queryData);
    // setSearchParams("");
  }

  return (
    <div style={{width: "100%", height: "95vh", overflowY: "scroll"}}>
      
      <div style={{width: "350px", margin: "auto", marginTop: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} components={{audio: false, finder: false}}/>
      </div>

      <div style={{textAlign: "center", marginBottom: "2em"}}>
        Scan een jury QR code of vraag naar login gegevens
      </div>
      <div style={{display: "flex", flexDirection: "column", gap: "1em", maxWidth: "20rem", margin: "auto"}}>
        <TextField label="Wedstrijd Id" value={contestId} onChange={e => setContestId(e.target.value)}/>
        <TextField label="Jury Id" value={judgeId} onChange={e => setJudgeId(e.target.value)}/>
        <TextField label="Authenticatie key" value={key} onChange={e => setKey(e.target.value)}/>
        <Button onClick={() => judgeUseCases.authenticate(contestId, judgeId, key)}>login</Button>

        <Link to="/admin">Admin</Link>
      </div>
    </div>
  )
}


export default function JudgeView(){
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [contest, setContest] = useState<Contest | null>(null);
  
  useEffect(() => {
    judgeUseCases.useIsAuthenticated((val) => setAuthenticated(val));
  }, [])

  useEffect(() => {
    judgeUseCases.useActiveContest((contest: Contest) => setContest(contest))
  }, [authenticated])
  
  return (
    <div style={{width: "100%", height: "100%"}}>
      {(!authenticated || contest === null) && (
        <Login />
      )}

      {authenticated && contest !== null && (
        <Routes>
          <Route path="" element={<Layout />} >
            <Route index element={<SelectParticipantView />} />
            <Route path=":participantId" element={<JudgeParticipantView contest={contest}/>} />
            <Route path="*" element={<SelectParticipantView />} />
          </Route>
        </Routes>
      )}

    </div>
  )
}