import { useEffect, useState } from "react"

import { Link, useParams } from "react-router-dom";
import { Button, Slider } from "@mui/material";


import { judgeUseCases } from "@/factory";
import { Contest, Participant, ScoreArea } from "@/domain";



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
  
  const sortedRankingsId = Object.values(contest.rankings).sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;}).map(val => val.id)
  const sortScoreAreas = (a: ScoreArea, b: ScoreArea): number => {
    let valA = sortedRankingsId.indexOf(a.id);
    let valB = sortedRankingsId.indexOf(b.id);

    if(valA > valB) {
      return 1;
    }
    if(valA < valB) {
      return -1;
    }
    if(a.name > b.name) {
      return 1;
    }
    if(a.name < b.name) {
      return 1;
    }
    return 0;
  }

  return (
    <div style={{width: "100%", height: "100%"}}>
      
      <h1>{participant.code} - {participant.name}</h1>
      <h2>{participant.category?.name}</h2>

      <div>

        {Object.values(contest.scoreAreas).sort(sortScoreAreas).map(val => (
          <PointsSlider key={val.id} title={val.name} min={0} max={val.maximumScore} step={1} value={score[val.id] || 0} setValue={(v) => setScore(p => ({...p, [val.id]: v}))}/>
        ))}

      </div>

      <Link to="/"><Button onClick={() => save()}>save</Button></Link>
      <Link to="/"><Button>cancel</Button></Link>
    </div>
  )
}
