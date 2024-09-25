import { Judge } from "@/domain";
import { adminUseCases } from "@/factory";
import { Button } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

import generatePDF, { Margin } from 'react-to-pdf';


export default function PrintJudges({judges}: {judges: Array<Judge>}) {

  const [qrJudges, setQrJudges] = useState<{[id: string]: {id: string, name: string, qrData: string}}>({});

  const documentRef = useRef(null)

  const options = {
    // filename: 'page.pdf',
    // default is `save`
    method: 'open',
    page: {
       margin: Margin.NONE,
       format: 'A4',
       orientation: 'portrait',
    },
    canvas: {
       mimeType: 'image/jpeg',
       qualityRatio: 1
    }
  };

  useEffect(() => {
    judges.forEach(judge => {
      adminUseCases.useJudgeQrCodeData(judge, (val) => {
        setQrJudges(v => ({...v, [judge.id]: {id: judge.id, name: judge.name, qrData: val}}))
      });
    })
  }, [judges]);


  const handleDownloadPDF = () =>{
    // @ts-ignore
    generatePDF(documentRef, options)
  }

  return (
    <div>
      <Button onClick={handleDownloadPDF}>Download PDF</Button>
      
      <div style={{position: "fixed", top: "200vh"}}>
        <div ref={documentRef} style={{fontFamily: "Arial", display: "flex", width: "210mm", flexWrap: "wrap"}}>
          {Object.values(qrJudges).map(judge => (
            <div key={judge.id} style={{width: "105mm", height: "74.3mm", padding: "10mm", border: "solid, 1px, #000", boxSizing: "border-box"}}>
              
              <div style={{display: "flex"}}>
                <h1 style={{flexGrow: 1, fontSize: "10mm"}}>
                  {judge.name}
                </h1>
                <div>
                  <QRCode value={judge.qrData} style={{width: "30mm", height: "auto"}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}