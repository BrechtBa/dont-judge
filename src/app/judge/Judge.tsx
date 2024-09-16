import { useEffect, useState } from "react"

import { Link, Outlet, Route, Routes } from "react-router-dom";
import { AppBar, Button, TextField, Toolbar } from "@mui/material";

import AccountMenu from "@/components/AccountMenu";

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

import { judgeUseCases } from "@/factory";
import { Contest, Participant } from "@/domain";
import JudgeParticipantView from "./JudgeParticipantView";



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

      <Outlet />
    </div>
  )
}

function Login() {
  
  const [contestId, setContestId] = useState<string>("");  
  const [judgeId, setJudgeId] = useState<string>("");
  const [key, setKey] = useState<string>("");

  const handleQRResult = (data: Array<IDetectedBarcode>) => {
    console.log(data)
    judgeUseCases.authenticateWithQrData(data[0].rawValue);
  }

  return (
    <div style={{width: "100%"}}>
      
      <div style={{width: "400px", margin: "auto", marginTop: "2em", marginBottom: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} />
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


function ParticipantsView(){
  const [participants, setParticipants] = useState<Array<Participant>>([]);

  useEffect(() => {
    judgeUseCases.useParticipants((val) => setParticipants(val));
  }, [])
  
  return (
    <div>
      <h1>Kies een groep</h1>

      <div>
        QR Reader
      </div>
      
      <div>
        {participants.map(participant => (
          <div key={participant.id}>
            <Link to={participant.id}>{participant.name}</Link>
          </div>
        ))}
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
            <Route index element={<ParticipantsView />} />
            <Route path=":participantId" element={<JudgeParticipantView contest={contest}/>} />
            <Route path="*" element={<ParticipantsView />} />
          </Route>
        </Routes>
      )}

    </div>
  )
}