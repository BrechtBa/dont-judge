import { useEffect, useState } from "react"

import { Link, Outlet, Route, Routes, useParams } from "react-router-dom";
import { AppBar, Button, Slider, TextField, Toolbar } from "@mui/material";

import AccountMenu from "@/components/AccountMenu";


import { judgeUseCases } from "@/factory";
import { Participant } from "@/domain";


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

  return (
    <div style={{width: "100%"}}>
      <div>
        QR reader
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


function PointsSlider({title, min, max, step, value, setValue}: {title: string, min: number, max: number, step: number, value: number, setValue: (val: number) => void}){
  
  const handleChange = (_: any, v: number | Array<number>) => {
    if (typeof v === 'number') {
      setValue(v);
    }
  }

  return (
    <div>
      <div>{title}: {value} punten</div>
      <Slider step={step} marks min={min} max={max} value={value} onChange={handleChange}></Slider>
    </div>
  )
}



function JudgeParticipantView(){

  const [participant, setParticipant] = useState<Participant | null>(null);
  
  const [points, setPoints] = useState<{[key: string]: number}>({cat1: 0, cat2: 0});


  let { participantId } = useParams();

  useEffect(() => {
    if(participantId === undefined ){
      setParticipant(null);
      return
    }

    judgeUseCases.useParticipant(participantId, (val) => setParticipant(val));

  }, [participantId])
  if( participant === null ){
    return null;
  }

  return (
    <div style={{width: "100%", height: "100%"}}>
      
      <h1>{participant.name}</h1>

      <div>
        <PointsSlider title="Cat1" min={0} max={15} step={1} value={points.cat1} setValue={(v) => setPoints(p => ({...p, cat1: v}))}/>
        <PointsSlider title="Cat2" min={0} max={10} step={1} value={points.cat2} setValue={(v) => setPoints(p => ({...p, cat2: v}))}/>
      </div>

      <Link to="/"><Button>save</Button></Link>
     
    </div>
  )
}



export default function JudgeView(){
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    judgeUseCases.useIsAuthenticated((val) => setAuthenticated(val));
  }, [])

  return (
    <div style={{width: "100%", height: "100%"}}>
      {!authenticated && (
        <Login />
      )}

      {authenticated && (
        <Routes>
          <Route path="" element={<Layout />} >
            <Route index element={<ParticipantsView />} />
            <Route path=":participantId" element={<JudgeParticipantView />} />
            <Route path="*" element={<ParticipantsView />} />
          </Route>
        </Routes>
      )}

    </div>
  )
}