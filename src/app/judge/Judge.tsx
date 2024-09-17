import { useEffect, useState } from "react"

import { Link, Outlet, Route, Routes } from "react-router-dom";
import { AppBar, Button, TextField, Toolbar } from "@mui/material";

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

import AccountMenu from "@/components/AccountMenu";

import JudgeParticipantView from "./JudgeParticipantView";
import SelectParticipantView from "./SelectParticipantView";

import { judgeUseCases } from "@/factory";
import { Contest } from "@/domain";


function Layout() {

  return (
    <div style={{width: "100%", height: "100%"}}>
      <AppBar position="static">
        <Toolbar>
          <div style={{ flexGrow: 1 }}>
          </div>
          <AccountMenu signOut={() => judgeUseCases.signOut()}/>
        </Toolbar>
      </AppBar>

      <div style={{paddingLeft: "1em", paddingRight: "1em", overflowY: "auto", position: "absolute", top: "70px", bottom: 0, left: 0, right: 0}}>
        <Outlet />
      </div>

    </div>
  )
}

function Login() {
  
  const [contestId, setContestId] = useState<string>("");  
  const [judgeId, setJudgeId] = useState<string>("");
  const [key, setKey] = useState<string>("");

  const handleQRResult = (data: Array<IDetectedBarcode>) => {
    judgeUseCases.authenticateWithQrData(data[0].rawValue);
  }

  return (
    <div style={{width: "100%"}}>
      
      <div style={{maxWidth: "400px", width: "90%", margin: "auto", marginTop: "2em", marginBottom: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} components={{audio: false}}/>
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: "1em", maxWidth: "20rem", margin: "auto"}}>
        <TextField label="Wedstrijd Id" value={contestId} onChange={e => setContestId(e.target.value)}/>
        <TextField label="Jury Id" value={judgeId} onChange={e => setJudgeId(e.target.value)}/>
        <TextField label="Authenticatie key" value={key} onChange={e => setKey(e.target.value)}/>
        <Button onClick={() => judgeUseCases.authenticate(contestId, judgeId, key)}>login</Button>
        <Link to="/admin"><Button>Admin</Button></Link>
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