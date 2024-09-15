import { useEffect, useState } from "react";

import { adminUseCases } from "@/factory";
import { Category, Judge, Participant, Score, ScoreCategory } from "@/domain";
import { Paper } from "@mui/material";



interface ParticipantScoreData {
  participant: Participant,
  scores: {
    [key:  string]: {
      judge: Judge,
      score: {
        [scoreCategoryId: string]: number,
        total: number
      }
    }
  }
}

function ScoreTableRow({title, scores}: {title: string, scores: Array<string>}) {
  
  return (
    <div style={{display: "flex", flexDirection: "row", width: "100%", position: "relative"}}>
      <div style={{width: "30%"}}>
        {title}
      </div>

      <div style={{display: "flex", flexDirection: "row", flexGrow: 1}}>
        {scores.map((val, index) => (
          <div key={index} style={{flexGrow: 1}}>
            {val}
          </div>
        ))}
      </div>
    </div>
  )
}



export default function ScoreView() {

  const [categories, setCategoriess] = useState<Array<Category>>([]);
  const [scoreData, setScoreData] = useState<Array<ParticipantScoreData>>([]);
  const [scoreCategories, setScoreCategories] = useState<Array<ScoreCategory>>([]);

  useEffect(() => {
    adminUseCases.useScores((scores: Array<Score>, scoreCategories: {[key: string]: ScoreCategory}, participants: Array<Participant>, judges: {[key: string]: Judge}) => {

      let participantScoreMap: {[key: string]: Array<Score>} = {}
      scores.forEach(score => {
        if( participantScoreMap[score.participantId] === undefined ) {
          participantScoreMap[score.participantId] = [];
        }
        participantScoreMap[score.participantId].push(score);
      })

      let categories: Array<Category> = [];

      participants.forEach(participant => {
        if(participant.category !== undefined && categories.indexOf(participant.category) == -1) {
          categories.push(participant.category)
        }
      })

      const data: Array<ParticipantScoreData> = participants.map((participant: Participant) => ({
        participant: participant,
        scores: participantScoreMap[participant.id].reduce((acc, score) => ({
          ...acc,
          [score.id]: {
            judge: judges[score.judgeId],
            score: {
              ...Object.values(scoreCategories).reduce((acc, scoreCategory) => ({
                ...acc,
                [scoreCategory.id]: score.score[scoreCategory.id] || 0
              }), {}),
              total: Object.values(scoreCategories).reduce((acc, scoreCategory) => acc + score.score[scoreCategory.id] || 0, 0)
            }
          }
        }), {})
      }));

      setCategoriess(categories);
      setScoreCategories(Object.values(scoreCategories))
      setScoreData(data)

    });
  }, [])

  console.log(scoreCategories);
  console.log(scoreData);

  const sumJudgeScores = (scores: {[key: string]: {judge: Judge, score: {[key: string]: number}}}): {[key: string]: number} => {

    return Object.values(scores).reduce((acc1: {[key: string]: number}, score) => Object.entries(score.score).reduce((acc2, [key, val]) => ({
      ...acc2,
      [key]: (acc1[key] === undefined ? 0 : acc1[key]) + val
    }), {}), {})

  }

  return (
    <div>
      <h1>Score</h1>
      
      <div>
        {categories.map(category => (
          <Paper key={category.id} style={{margin: "1em"}}>
            <h1>{category.name}</h1>


            <ScoreTableRow title="Groep" scores={[...scoreCategories.map(val => val.name), "Totaal"]}/>

            {scoreData.filter(data => data.participant.category !== undefined && data.participant.category.id === category.id).map(data => (
              <div key={data.participant.id}>

                <ScoreTableRow title={data.participant.name} scores={[...scoreCategories.map(val => val.id), "total"].map(key => sumJudgeScores(data.scores)[key].toString())}/>

              </div>  
            ))}

          </Paper>
        ))}

        
      </div>

    </div>
  );
}
