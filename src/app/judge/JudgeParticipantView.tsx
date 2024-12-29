import { useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom";
import { Button, Rating } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';

import { judgeUseCases, viewUseCases } from "@/factory";
import { Contest, Participant } from "@/domain";



function ScoreSetter({title, comment, max, step, value, setValue}: {title: string, comment: string, max: number, step: number, value: number, setValue: (val: number) => void}){

  return (
    <div style={{marginBottom: "1em"}}>
      <div style={{fontWeight: 600}}>{title}: <span style={{marginLeft: "0.5em"}}>{value} / {max}</span></div>
      <div>{comment}</div>
      <Rating value={value} precision={step} max={max} size={max > 10 ? "medium" : "large"}
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

  const clear = () => {
    if( participantId === undefined ){
      return
    }
    judgeUseCases.deleteScore(participantId);
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
          <ScoreSetter key={val.id} title={val.name} comment={val.comment} max={val.maximumScore} step={1} value={score[val.id] || 0} setValue={(v) => setScore(p => ({...p, [val.id]: v}))}/>
        ))}

      </div>

      <Link to="/"><Button onClick={() => save()}>save</Button></Link>
      <Link to="/"><Button>cancel</Button></Link>
      <Link to="/"><Button color="error" onClick={() => clear()}>clear</Button></Link>
    </div>
  )
}
