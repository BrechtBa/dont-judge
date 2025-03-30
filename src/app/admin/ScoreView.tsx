import { useEffect, useState } from "react";

import PaperlistItem from "@/components/PaperListItem";

import { adminUseCases, viewUseCases } from "@/factory";
import { Contest, ParticipantScoreData, ScoreArea, Participant, RankingData, Ranking, sortParticipantByCodeFunction } from "@/domain";
import PrintScore from "./PrintScore";


const getColWidth = (n: number) => {
  return `${60/n}%`;
}

function ParticipantScore({participant, participantScoreData, scoreAreas, rank}: {participant: Participant, participantScoreData: ParticipantScoreData, scoreAreas: Array<ScoreArea>, rank: string}) {

  const [showDetail, setShowDetails] = useState(false);

  return (
    <>
      <div style={{display: "table-row", cursor: "pointer"}} onClick={() => setShowDetails(val => !val)}>
        <div style={{display: "table-cell", width: "5%"}}>
          {rank}
        </div>


        <div style={{display: "table-cell", width: "20%"}}>
          <div style={{display: "flex"}}>
            <div style={{width: "3em"}}>{participant.code}</div>
            <div>{participant.name}</div>
          </div>
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

  const sortFunction = (a: ParticipantScoreData, b: ParticipantScoreData) => {
    if(b.totalScore.total > a.totalScore.total){
      return 1
    }
    if(b.totalScore.total < a.totalScore.total){
      return -1
    }
    return sortParticipantByCodeFunction(a.participant, b.participant)
  }

  let rankedParticipantScoreData: Array<{rank: string, data: ParticipantScoreData}> = [];


  let lastScore: number | null = null;
  participantScoreData.sort(sortFunction).forEach((data, index) => {

    let dataScore = data.totalScore.total || 0;
    let rank = ""

    if(lastScore === null || lastScore !== dataScore) {
      rank = (index+1).toFixed(0);
    }

    rankedParticipantScoreData.push({rank: rank, data: data});
    lastScore = dataScore
  });


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
            <div>{val.name}</div>
            <div style={{color: "var(--less-important-color)"}}>/{val.maximumScore}</div>
          </div>
        ))}

        <div style={{display: "table-cell", width: "15%", textAlign: "right"}}>
          <div>Totaal</div>
          <div style={{color: "var(--less-important-color)"}}>/{scoreAreas.reduce((acc, val) => acc + val.maximumScore, 0)}</div>
        </div>
      </div>

      {rankedParticipantScoreData.map(val => (
        <ParticipantScore key={val.data.participant.id} participant={val.data.participant} participantScoreData={val.data} scoreAreas={scoreAreas} rank={val.rank}/>
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
            <div style={{width: "100%", paddingBottom: "0.5em"}}>
              <h2>{category.name}</h2>
              <ScoreTable scoreAreas={filteredScoreAreas} participantScoreData={rankingData.participantScoreData.filter(data => data.participant.category !== undefined && data.participant.category.id === category.id)}/>
            </div>
          </PaperlistItem>
        ))
      )}
       { !rankingData.ranking.perCategory && (
        <PaperlistItem>
          <div style={{width: "100%", paddingBottom: "0.5em"}}>
            <ScoreTable scoreAreas={filteredScoreAreas} participantScoreData={rankingData.participantScoreData}/>
          </div>
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

      <PrintScore contest={contest} scoreDataPerParticipant={viewUseCases.getScoreDataPerParticipant(rankingData)} />

    </div>
  );
}
