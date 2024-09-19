import { useEffect, useState } from "react";

import PaperlistItem from "@/components/PaperListItem";

import { adminUseCases } from "@/factory";
import { Contest, ParticipantScoreData } from "@/domain";


function ParticipantScore({data, contest, number}: {data: ParticipantScoreData, contest:Contest, number: number}) {

  const [showDetail, setShowDetails] = useState(false);

  const colWidth = `${60/Object.keys(contest.scoreAreas).length}%`;

  return (
    <>
      <div style={{display: "table-row", cursor: "pointer"}} onClick={() => setShowDetails(val => !val)}>
        <div style={{display: "table-cell", width: "5%"}}>
          {number}
        </div>

        <div style={{display: "table-cell", width: "20%"}}>
          {data.participant.name}
        </div>

        {Object.values(contest.scoreAreas).map(val => val.id).map(key => (
          <div key={key} style={{display: "table-cell", width: colWidth}}>
            {(data.totalScore.scoreAreas[key] || 0).toString()}
          </div>
        ))}

        <div style={{display: "table-cell", width: "15%"}}>
          {(data.totalScore.total || 0).toString()}
        </div>
      </div>

      {Object.values(data.judgeScores).map(judgeScore => (
        <div key={judgeScore.judge.id} style={{display: showDetail ? "table-row": "none", color: "#888"}}>
          <div style={{display: "table-cell", width: "5%"}}>
          </div>

          <div style={{display: "table-cell", width: "20%", paddingLeft: "1em"}}>
            {judgeScore.judge.name}
          </div>

          {Object.values(contest.scoreAreas).map(val => val.id).map(key => (
            <div key={key} style={{display: "table-cell", width: colWidth, paddingLeft: "1em"}}>
              {(judgeScore.scoreAreas[key] || 0).toString()}
            </div>
          ))}

          <div style={{display: "table-cell", width: "15%", paddingLeft: "1em"}}>
            {(judgeScore.total || 0).toString()}
          </div>

        </div>
      ))}
      
    </>
  )
}


export default function ScoreView() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [participantScores, setParticipantScores] = useState<Array<ParticipantScoreData>>([]);

  useEffect(() => {
    adminUseCases.useParticipantScores((scores, contest) => {
      setParticipantScores(scores);
      setContest(contest);
    });
  }, []);

  if(contest === null) {
    return null;
  }

  const colWidth = `${60/Object.keys(contest.scoreAreas).length}%`;

  return (
    <div>
      <h1>Score</h1>
      
      <div>
        {Object.values(contest.categories).map(category => (
          <PaperlistItem key={category.id}>
            <h1>{category.name}</h1>

            <div style={{display: "table", width: "100%"}}>
              <div style={{display: "table-row"}}>
                <div style={{display: "table-cell", width: "5%"}}>
                </div>

                <div style={{display: "table-cell", width: "20%"}}>
                  Groep
                </div>

                {Object.values(contest.scoreAreas).map(val => val.name).map(val => (
                  <div key={val} style={{display: "table-cell", width: colWidth}}>
                    {val}
                  </div>
                ))}

                <div style={{display: "table-cell", width: "15%"}}>
                  Totaal
                </div>
              </div>

              {participantScores.filter(data => data.participant.category !== undefined && data.participant.category.id === category.id).sort((a, b) => b.totalScore.total - a.totalScore.total).map((data, index) => (
                <ParticipantScore key={data.participant.id} data={data} contest={contest} number={index+1}/>
              ))}
            </div>

          </PaperlistItem>
        ))}

        
      </div>

    </div>
  );
}
