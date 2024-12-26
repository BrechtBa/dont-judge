import { Contest, ScoreDataPerParticipant } from "@/domain";
import { viewUseCases } from "@/factory";
import { Button } from "@mui/material";
import { useRef } from "react";

import generatePDF, { Margin } from 'react-to-pdf';


export default function PrintScore({contest, scoreDataPerParticipant}: {contest: Contest, scoreDataPerParticipant: Array<ScoreDataPerParticipant>}) {

  const documentRef = useRef(null)

  const options = {
    // filename: 'page.pdf',
    // default is `save`
    method: 'open',
    page: {
       margin: Margin.MEDIUM,
       format: 'A4',
       orientation: 'landscape',
    },
    canvas: {
       mimeType: 'image/jpeg',
       qualityRatio: 1
    }
  };

  const handleDownloadPDF = () =>{
    // @ts-ignore
    generatePDF(documentRef, options)
  }

  const sortedScoreAreas = viewUseCases.getSortedScoreAreas(contest);

  return (
    <div>
      
      <Button onClick={handleDownloadPDF}>Download PDF</Button>
      
      <div style={{position: "fixed", top: "200vh"}}>
        <div ref={documentRef} style={{fontFamily: "Arial"}}>
          {scoreDataPerParticipant.map(data => (
            <div key={data.participant.id} style={{height: "190.02mm", width: "275mm"}}>
              
              <div style={{display: "flex"}}>
                <h1 style={{minWidth: "30mm", fontSize: "10mm"}}>{data.participant.code}</h1>
                <h1 style={{flexGrow: 1, fontSize: "10mm"}}>{data.participant.name}</h1>
              </div>

              <h1 style={{fontSize: "6mm"}}>{data.participant.category === undefined ? "" : data.participant.category.name}</h1>

              {data.rankingData.map(val => (
                <div key={val.ranking.id}>
                  <h2 style={{fontSize: "5mm"}}>{val.ranking.name}</h2>

                  {sortedScoreAreas.filter(scoreArea => val.ranking.scoreAreas[scoreArea.id]).map(scoreArea => (
                    <div key={scoreArea.id}>
                      {scoreArea.name}: {(val.score.totalScore.scoreAreas[scoreArea.id] || 0).toFixed(2)} / {scoreArea.maximumScore}
                    </div>
                  ))}
                  <div>
                    Totaal: {(val.score.totalScore.total || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}