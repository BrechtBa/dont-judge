import { useEffect, useState } from "react"

import { adminUseCases, viewUseCases } from "@/factory";
import { Contest, Judge, Score, ScoreArea } from "@/domain";


function JudgeScoreStatistics({scores, judges, scoreArea}: {scores: Array<Score>, judges: Array<Judge>, scoreArea: ScoreArea}){

  const scoreToPixels = (score: number) : string => {
    return `${200 * score / scoreArea.maximumScore}px`
  }

  const getJudgeScores = (judge: Judge): Array<number> => {
    return scores.filter(s => s.judgeId === judge.id).map(s => s.score[scoreArea.id])
  }

  const getAverage = (numbers: Array<number>): number => {
    if(numbers.length === 0){
      return 0
    }

    const sum = numbers.reduce((a, b) => a + b, 0);
    return sum/numbers.length;
  }

  const getMax = (numbers: Array<number>): number => {
    if(numbers.length === 0){
      return 0
    }
    return numbers.reduce((a, b) => a > b ? a : b, 0);
  }
  const getMin = (numbers: Array<number>): number => {
    if(numbers.length === 0){
      return 0
    }
    return numbers.reduce((a, b) => a < b ? a : b, scoreArea.maximumScore);
  }

    
  return (
    <div>
      <div style={{display: "flex", width: "90%", gap: "1em", justifyContent: "flex-end", marginBottom: "0.5em", marginTop: "-0.5em"}}>
        <div  style={{display: "flex",gap: "1em", alignItems: "center"}}>
          <div style={{backgroundColor: "blue", width: "2em", height: "2px"}}>&nbsp;</div>
          <div>Minimum</div>
        </div>
        <div  style={{display: "flex",gap: "1em", alignItems: "center"}}>
          <div style={{backgroundColor: "red", width: "2em", height: "2px"}}>&nbsp;</div>
          <div>Maximum</div>
        </div>
        <div  style={{display: "flex",gap: "1em", alignItems: "center"}}>
          <div style={{backgroundColor: "green", width: "2em", height: "2px"}}>&nbsp;</div>
          <div>Average</div>
        </div>
      </div>

      <div style={{display: "flex", width: "90%", gap: "1em", alignItems: "flex-end"}}>

        <div style={{width: "2.5em"}}>
          <div style={{height: "200px", position: "relative"}}>
            <div style={{backgroundColor: "#ddd", width: "100%", height: "2px", bottom: "0px", position: "absolute"}}>0</div>
            <div style={{width: "100%", height: "2px", bottom: "99px", position: "absolute"}}>Score</div>
            <div style={{backgroundColor: "#ddd", width: "100%", height: "2px", bottom: "198px", position: "absolute"}}>{scoreArea.maximumScore}</div>
          </div>
          <div style={{width: "1px"}}>&nbsp;</div>
        </div>

        {judges.map(judge => (
          <div key={judge.id} style={{flexGrow: 1}}>
            <div style={{backgroundColor: "#ddd", height: "200px", position: "relative"}}>
              <div style={{width: "100%", height: "10px", bottom: "200px", textAlign: "center"}}># {getJudgeScores(judge).length}</div>
              <div style={{backgroundColor: "green", width: "100%", height: "2px", bottom: scoreToPixels(getAverage(getJudgeScores(judge))), position: "absolute"}}>&nbsp;</div>
              <div style={{backgroundColor: "red", width: "100%", height: "2px", bottom: scoreToPixels(getMax(getJudgeScores(judge))), position: "absolute"}}>&nbsp;</div>
              <div style={{backgroundColor: "blue", width: "100%", height: "2px", bottom: scoreToPixels(getMin(getJudgeScores(judge))), position: "absolute"}}>&nbsp;</div>
            
            </div>
            <div style={{width: "1px"}}>{judge.name}</div>
          </div>
        ))}

      </div>
    </div>
  )
}



export default function StatsView(){

  const [contest, setContest] = useState<Contest | null>(null);
  const [judges, setJudges] = useState<Array<Judge>>([]);
  const [scores, setScores] = useState<Array<Score>>([]);

  useEffect(() => {
    adminUseCases.useJudges(judges => setJudges(judges))
    adminUseCases.useAllScores((scores, contest) => {
      setContest(contest);
      setScores(scores.map(s => ({...s, score: {...s.score, "__total__": Object.values(s.score).reduce((a, v) => a + v, 0)}})));
    });
  }, []);

  if(contest === null) {
    return null;
  }


  return (
    <div>
      <h1>Jury Statistics</h1>

      <div>
        {viewUseCases.getSortedScoreAreas(contest).map(area => (
          <div key={area.id} style={{marginBottom: "2em"}}>
            <h1>{area.name}</h1>
            <JudgeScoreStatistics scores={scores} judges={judges} scoreArea={area}/>
          </div>
        ))}

        <div style={{marginBottom: "2em"}}>
          <h1>Total</h1>
          <JudgeScoreStatistics scores={scores} judges={judges} scoreArea={{id: "__total__", name: "Total", comment: "", maximumScore: Object.values(contest.scoreAreas).reduce((a, v) => a + v.maximumScore, 0)}}/>
        </div>

      </div>
    </div>
  );
}