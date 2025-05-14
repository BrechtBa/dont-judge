import { useEffect, useState } from "react"

import { Link, useNavigate } from "react-router-dom";

import { IDetectedBarcode, Scanner } from "@yudiel/react-qr-scanner";

import { judgeUseCases } from "@/factory";
import { Participant } from "@/domain";
import PaperlistItem from "@/components/PaperListItem";
import { TextField } from "@mui/material";


export default function SelectParticipantView(){
  const [participants, setParticipants] = useState<Array<Participant>>([]);
  const [filter, setFilter] = useState("");

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

  const participantsFilter = (participant: Participant) => {
    const trimmedFilter = filter.trim().toLowerCase()
    if(trimmedFilter === "") {
      return true
    }
    if(participant.code.toLowerCase().includes(trimmedFilter)) {
      return true
    }
    if(participant.name.toLowerCase().includes(trimmedFilter)) {
      return true
    }
    return false;
  }
  
  return (
    <div>
      <h1>Kies een groep</h1>

      <div style={{width: "350px", height: "350px", margin: "auto", marginTop: "2em", marginBottom: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} components={{audio: false, finder: false}}/>
      </div>
      
      <TextField value={filter} label="Filter" onChange={(e) => setFilter(e.target.value)}/>

      <div>
        {participants.filter(participantsFilter).map(participant => (
          <Link key={participant.id} to={participant.id}>
            <PaperlistItem>
              <div style={{width: "3em"}}>
                {participant.code}
              </div>
              <div style={{flexGrow: 1}}>
                <div>{participant.name}</div>
                <div style={{color: "var(--less-important-color)"}}>{participant.category?.name}</div>
              </div>
              <div style={{width: "8em", textAlign: "right"}}># evaluaties: {participant.judgedBy.length}</div>
            </PaperlistItem>
          </Link>
        ))}
      </div>
     
    </div>
  )
}