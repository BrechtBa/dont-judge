import { useEffect, useState } from "react"

import { Link, useNavigate } from "react-router-dom";

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

      <div style={{width: "350px", height: "350px", margin: "auto", marginTop: "2em", marginBottom: "2em"}}>
        <Scanner onScan={(data) => handleQRResult(data)} components={{audio: false}}/>
      </div>
      
      <div>
        {participants.map(participant => (
          <Link key={participant.id} to={participant.id}>
            <PaperlistItem>
              <div style={{display: "flex"}}>
                <div style={{flexGrow: 1}}>{participant.name}</div>
                <div style={{width: "2em", textAlign: "right"}}>{participant.judgedBy.length}</div>
              </div>
            </PaperlistItem>
          </Link>
        ))}
      </div>
     
    </div>
  )
}