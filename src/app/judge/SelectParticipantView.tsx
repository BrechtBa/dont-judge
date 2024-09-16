import { useEffect, useState } from "react"

import { Link, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { AppBar, Button, TextField, Toolbar } from "@mui/material";

import AccountMenu from "@/components/AccountMenu";

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

import { judgeUseCases } from "@/factory";
import { Participant } from "@/domain";
import PaperlistItem from "@/components/PaperListItem";


export default function SelectParticipantView(){
  const [participants, setParticipants] = useState<Array<Participant>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    judgeUseCases.useParticipants((val) => setParticipants(val));
  }, [])

  const handleQRResult = (data: Array<IDetectedBarcode>) => {
    const participantId = data[0].rawValue;
    if(participants.filter(participant => participant.id === participantId).length === 0){
      return
    }
    navigate(participantId);
  }

  
  return (
    <div>
      <h1>Kies een groep</h1>

      <div style={{width: "400px", margin: "auto", marginTop: "2em", marginBottom: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} />
      </div>
      
      <div>
        {participants.map(participant => (
          <Link key={participant.id} to={participant.id}>
            <PaperlistItem>
              {participant.name}
            </PaperlistItem>
          </Link>
        ))}
      </div>
     
    </div>
  )
}