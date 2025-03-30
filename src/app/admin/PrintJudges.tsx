import PrintList from "@/components/PrintLists";
import { Judge } from "@/domain";
import { adminUseCases } from "@/factory";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";

import { Margin } from 'react-to-pdf';


interface QrJudge {
  id: string, name: string, qrData: string
}

export default function PrintJudges({judges}: {judges: Array<Judge>}) {

  const [qrJudges, setQrJudges] = useState<{[id: string]: QrJudge}>({});

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
        if(val === null){
          return;
        }
        setQrJudges(v => ({...v, [judge.id]: {id: judge.id, name: judge.name, qrData: val.url}}))
      });
    })
  }, [judges]);


  const itemLayoutFunction = (item: QrJudge) => (
    <div key={item.id} style={{width: "105mm", height: "74.3mm", padding: "10mm", border: "solid, 1px, #000", boxSizing: "border-box"}}>
              
      <div style={{display: "flex"}}>
        <h1 style={{flexGrow: 1, fontSize: "10mm"}}>
          {item.name}
        </h1>
        <div>
          <QRCode value={item.qrData} style={{width: "30mm", height: "auto"}}/>
        </div>
      </div>
    </div>

  );

  return (
    <div>
      <PrintList items={Object.values(qrJudges)} itemLayoutFunction={itemLayoutFunction} maxItemsPerDocument={20} pageStyle={{fontFamily: "Arial", display: "flex", width: "210mm", flexWrap: "wrap"}} pdfOptions={options}/>
    </div>
  );
}