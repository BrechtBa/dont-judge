import { useEffect, useState } from "react";

import PaperlistItem from "@/components/PaperListItem";

import { adminUseCases } from "@/factory";
import { Category, Judge, Participant, Score, ScoreArea } from "@/domain";



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


export default function ScoreView() {

  const [categories, setCategoriess] = useState<Array<Category>>([]);
  const [scoreData, setScoreData] = useState<Array<ParticipantScoreData>>([]);
  const [scoreCategories, setScoreCategories] = useState<Array<ScoreArea>>([]);

  useEffect(() => {
    adminUseCases.useScores((scores: Array<Score>, scoreCategories: {[key: string]: ScoreArea}, participants: Array<Participant>, judges: {[key: string]: Judge}) => {

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
        scores: (participantScoreMap[participant.id] || []).reduce((acc, score) => ({
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
  }, []);

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
          <PaperlistItem key={category.id}>
            <h1>{category.name}</h1>

            <div style={{display: "table", width: "100%"}}>
              <div style={{display: "table-row"}}>
                <div style={{display: "table-cell"}}>
                </div>

                <div style={{display: "table-cell"}}>
                  Groep
                </div>

                {[...scoreCategories.map(val => val.name), "Totaal"].map(val => (
                  <div key={val} style={{display: "table-cell"}}>
                    {val}
                  </div>
                ))}
              </div>

              {scoreData.filter(data => data.participant.category !== undefined && data.participant.category.id === category.id).sort((a, b) => sumJudgeScores(b.scores).total-sumJudgeScores(a.scores).total).map((data, index) => (
                <div key={index} style={{display: "table-row"}}>
                  <div style={{display: "table-cell"}}>
                    {index+1}
                  </div>

                  <div style={{display: "table-cell"}}>
                    {data.participant.name}
                  </div>

                  {[...scoreCategories.map(val => val.id), "total"].map(key => ({key: key, val: (sumJudgeScores(data.scores)[key] || 0).toString()})).map(keyVal => (
                    <div key={keyVal.key} style={{display: "table-cell"}}>
                      {keyVal.val}
                    </div>
                  ))}
                </div>

              ))}
            </div>


          </PaperlistItem>
        ))}

        
      </div>

    </div>
  );
}
