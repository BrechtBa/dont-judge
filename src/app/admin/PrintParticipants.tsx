import { Contest, Participant } from "@/domain";
import { Button } from "@mui/material";
import { useRef } from "react";
import QRCode from "react-qr-code";

import generatePDF, { Margin } from 'react-to-pdf';


export default function PrintParticipants({contest, participants}: {contest: Contest, participants: Array<Participant>}) {

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

  return (
    <div>
      
      <Button onClick={handleDownloadPDF}>Download PDF</Button>
      
      <div style={{position: "fixed", top: "200vh"}}>
        <div ref={documentRef} style={{fontFamily: "Arial"}}>
          {participants.map(participant => (
            <div key={participant.id} style={{height: "190.02mm", width: "275mm"}}>
              
              <div style={{display: "flex", height: "100%"}}>
                <div style={{flexGrow: 1}}>
                  <h1 style={{fontSize: "15mm"}}>{participant.code}</h1>
                  <h1 style={{fontSize: "15mm"}}>{participant.name}</h1>
                  <h1 style={{fontSize: "8mm"}}>{participant.category === undefined ? "" : participant.category.name}</h1>
                </div>

                <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
                  <div style={{flexGrow: 1}}>
                    {contest.logo !== null && (
                      <img src={contest.logo} style={{maxWidth: "80mm", maxHeight: "80mm"}}/>
                    )}
                  </div>
                  <div>
                    <QRCode value={participant.id} style={{width: "80mm", height: "auto"}}/>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}