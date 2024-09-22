import { useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom";
import { Button, Rating } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';

import { judgeUseCases, viewUseCases } from "@/factory";
import { Contest, Participant } from "@/domain";



function ScoreSetter({title, max, step, value, setValue}: {title: string, max: number, step: number, value: number, setValue: (val: number) => void}){
  
  const getPointsLabel = (value: number) => {
    if(value === 1) {
      return "punt";
    }
    return "punten";
  }

  return (
    <div style={{marginBottom: "1em"}}>
      <div>{title}: {value} {getPointsLabel(value)}</div>
      {/* <Slider step={step} marks min={0} max={max} value={value} onChange={(_, newValue) => {if(typeof newValue === 'number') setValue(newValue)}}></Slider> */}
      <Rating value={value} precision={step} max={max} size={max > 10 ? "small" : "medium"}
        onChange={(_, newValue) => {if(newValue!==null) setValue(newValue)}}
        emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
      />
    </div>
  )
}



export default function JudgeParticipantView({contest}: {contest: Contest}){

  const [participant, setParticipant] = useState<Participant | null>(null);
  const [score, setScore] = useState<{[key: string]: number}>({});

  let { participantId } = useParams();

  useEffect(() => {
    if( participantId === undefined ){
      setParticipant(null);
      return
    }
    judgeUseCases.useParticipant(participantId, (val) => setParticipant(val));
  }, [participantId])

  useEffect(() => {
    if( participantId === undefined ){
      setScore({});
      return
    }
    judgeUseCases.getScore(participantId, (val) => setScore(val.score));
  }, [participantId])

  const save = () => {
    if( participantId === undefined ){
      return
    }
    judgeUseCases.setScore(participantId, score);
  }

  if( participant === null ){
    return null;
  }
  
  return (
    <div style={{width: "100%", height: "100%"}}>
      
      <h1>{participant.code} - {participant.name}</h1>
      <h2>{participant.category?.name}</h2>

      <div>

        {viewUseCases.getSortedScoreAreas(contest).map(val => (
          <ScoreSetter key={val.id} title={val.name} max={val.maximumScore} step={1} value={score[val.id] || 0} setValue={(v) => setScore(p => ({...p, [val.id]: v}))}/>
        ))}

      </div>

      <Link to="/"><Button onClick={() => save()}>save</Button></Link>
      <Link to="/"><Button>cancel</Button></Link>
    </div>
  )
}
