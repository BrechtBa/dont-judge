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
                <div style={{flexGrow: 1}}>
                  <h1 style={{fontSize: "10mm"}}>{contest.name}</h1>
                  <p style={{fontSize: "10mm"}}>{contest.description}</p>

                  <div style={{display: "flex"}}>
                    <h1 style={{minWidth: "30mm", fontSize: "10mm"}}>{data.participant.code}</h1>
                    <h1 style={{flexGrow: 1, fontSize: "10mm"}}>{data.participant.name}</h1>
                  </div>

                  <h1 style={{fontSize: "6mm"}}>{data.participant.category === undefined ? "" : data.participant.category.name}</h1>
                </div>

                {contest.logo !== null && (
                  <img src={contest.logo} style={{maxWidth: "80mm", maxHeight: "80mm"}}/>
                )}
              </div>

              <div style={{display: "flex", gap: "5mm", flexWrap: "wrap", marginTop: "5mm"}}>   
                {data.rankingData.map(val => (
                  <div key={val.ranking.id} style={{flexGrow: 1, minWidth: "50mm"}}>
                    <h2 style={{fontSize: "5mm"}}>{val.ranking.name}</h2>

                    {sortedScoreAreas.filter(scoreArea => val.ranking.scoreAreas[scoreArea.id]).map(scoreArea => (
                      <div key={scoreArea.id}>
                        {scoreArea.name}: {(val.score.totalScore.scoreAreas[scoreArea.id] || 0).toFixed(2)} / {scoreArea.maximumScore}
                      </div>
                    ))}
                    <div>
                      Totaal: {(val.score.totalScore.total || 0).toFixed(2)} / {sortedScoreAreas.filter(scoreArea => val.ranking.scoreAreas[scoreArea.id]).reduce((acc, area) => acc + area.maximumScore, 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}