import PrintList from "@/components/PrintLists";
import { Contest, Participant } from "@/domain";
import QRCode from "react-qr-code";
import { Margin } from 'react-to-pdf';


export default function PrintParticipants({contest, participants}: {contest: Contest, participants: Array<Participant>}) {

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

  const itemLayoutFunction = (item: Participant) => (
    <div key={item.id} style={{height: "190.02mm", width: "275mm"}}>
              
      <div style={{display: "flex", height: "100%"}}>
        <div style={{flexGrow: 1}}>
          <h1 style={{fontSize: "15mm"}}>{item.code}</h1>
          <h1 style={{fontSize: "15mm"}}>{item.name}</h1>
          <h1 style={{fontSize: "8mm"}}>{item.category === undefined ? "" : item.category.name}</h1>
        </div>

        <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
          <div style={{flexGrow: 1}}>
            {contest.logo !== null && (
              <img src={contest.logo} style={{maxWidth: "80mm", maxHeight: "80mm"}}/>
            )}
          </div>
          <div>
            <QRCode value={item.id} style={{width: "80mm", height: "auto"}}/>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div>
      <PrintList items={participants} itemLayoutFunction={itemLayoutFunction} maxItemsPerDocument={10} pageStyle={{fontFamily: "Arial"}} pdfOptions={options}/>
    </div>
  );
}