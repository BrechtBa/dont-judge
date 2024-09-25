import { useEffect, useState } from "react";

import PaperlistItem from "@/components/PaperListItem";

import { adminUseCases, viewUseCases } from "@/factory";
import { Contest, ParticipantScoreData, ScoreArea, Participant, RankingData, Ranking } from "@/domain";


const getColWidth = (n: number) => {
  return `${60/n}%`;
}

function ParticipantScore({participant, participantScoreData, scoreAreas, number}: {participant: Participant, participantScoreData: ParticipantScoreData, scoreAreas: Array<ScoreArea>, number: number}) {

  const [showDetail, setShowDetails] = useState(false);

  return (
    <>
      <div style={{display: "table-row", cursor: "pointer"}} onClick={() => setShowDetails(val => !val)}>
        <div style={{display: "table-cell", width: "5%"}}>
          {number}
        </div>

        <div style={{display: "table-cell", width: "20%"}}>
          {participant.code} - {participant.name}
        </div>

        {scoreAreas.map(val => val.id).map(key => (
          <div key={key} style={{display: "table-cell", width: getColWidth(scoreAreas.length), textAlign: "right"}}>
            {(participantScoreData.totalScore.scoreAreas[key] || 0).toFixed(2)}
          </div>
        ))}

        <div style={{display: "table-cell", width: "15%", textAlign: "right"}}>
          {(participantScoreData.totalScore.total || 0).toFixed(2)}
        </div>
      </div>

      {Object.values(participantScoreData.judgeScores).map(judgeScore => (
        <div key={judgeScore.judge.id} style={{display: showDetail ? "table-row": "none", color: "var(--less-important-color)"}}>
          <div style={{display: "table-cell", width: "5%"}}>
          </div>

          <div style={{display: "table-cell", width: "20%", paddingLeft: "1em"}}>
            {judgeScore.judge.name}
          </div>

          {scoreAreas.map(val => val.id).map(key => (
            <div key={key} style={{display: "table-cell", width: getColWidth(scoreAreas.length), paddingLeft: "1em", textAlign: "right"}}>
              {(judgeScore.scoreAreas[key] || 0).toString()}
            </div>
          ))}

          <div style={{display: "table-cell", width: "15%", paddingLeft: "1em", textAlign: "right"}}>
            {(judgeScore.total || 0).toString()}
          </div>

        </div>
      ))}
      
    </>
  )
}


function ScoreTable({scoreAreas, participantScoreData}: {scoreAreas: Array<ScoreArea>, participantScoreData: Array<ParticipantScoreData>}) {

  return (
    <div style={{display: "table", width: "100%"}}>
      <div style={{display: "table-row"}}>
        <div style={{display: "table-cell", width: "5%"}}>
        </div>

        <div style={{display: "table-cell", width: "20%"}}>
          Groep
        </div>

        {scoreAreas.map(val => (
          <div key={val.name} style={{display: "table-cell", width: getColWidth(scoreAreas.length), textAlign: "right"}}>
            {val.name}
          </div>
        ))}

        <div style={{display: "table-cell", width: "15%", textAlign: "right"}}>
          Totaal
        </div>
      </div>

      {participantScoreData.sort((a, b) => b.totalScore.total - a.totalScore.total).map((data, index) => (
        <ParticipantScore key={data.participant.id} participant={data.participant} participantScoreData={data} scoreAreas={scoreAreas} number={index+1}/>
      ))}
    </div>
  );
}

function RankingScores({rankingData, contest, ranking}: {rankingData: RankingData, contest: Contest, ranking: Ranking}) {
  
  const filteredScoreAreas = viewUseCases.getSortedScoreAreas(contest).filter(r => ranking.scoreAreas[r.id]);

  return (
    <div>
      { rankingData.ranking.perCategory && (
        viewUseCases.getSortedCategories(contest).map(category => (
          <PaperlistItem key={category.id}>
            <h2>{category.name}</h2>
            <ScoreTable scoreAreas={filteredScoreAreas} participantScoreData={rankingData.participantScoreData.filter(data => data.participant.category !== undefined && data.participant.category.id === category.id)}/>
          </PaperlistItem>
        ))
      )}
       { !rankingData.ranking.perCategory && (
        <PaperlistItem>
          <ScoreTable scoreAreas={filteredScoreAreas} participantScoreData={rankingData.participantScoreData}/>
        </PaperlistItem>
       )}
    </div>
  );
}


export default function ScoreView() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [rankingData, setRankingData] = useState<{[key: string]: RankingData}>({});

  useEffect(() => {
    adminUseCases.useParticipantScores((data, contest) => {
      setRankingData(data);
      setContest(contest);
    });
  }, []);

  if(contest === null) {
    return null;
  }

  return (
    <div>
      <h1>Score</h1>
      
      <div>
        {viewUseCases.getSortedRankings(contest).map(ranking => (
          <div key={ranking.id}>
            <h1>{ranking.name}</h1>
            <RankingScores rankingData={rankingData[ranking.id]} contest={contest} ranking={ranking}/>
          </div>
        ))}

      </div>

    </div>
  );
}
