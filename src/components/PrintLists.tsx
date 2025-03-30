import { Button } from "@mui/material";
import { ReactNode, useEffect, useRef, useState } from "react";

import generatePDF from 'react-to-pdf';


function PrintPartialList<T>({items, itemLayoutFunction, print, pageStyle, pdfOptions}: {items: Array<T>, itemLayoutFunction: (item: T) => ReactNode, print: boolean, pageStyle: {}, pdfOptions: {}}) {
  const documentRef = useRef(null)

  useEffect(() => {
    if(print) {
      console.log("printing");
      // @ts-ignore
      generatePDF(documentRef, pdfOptions);
    }
  }, [print]);

  return (
    <div>
      <div style={{position: "fixed", top: "200vh"}}>
        <div ref={documentRef} style={pageStyle}>
          {items.map(item => itemLayoutFunction(item))}
        </div>
      </div>
    </div>
  );

}

export default function PrintList<T>({items, itemLayoutFunction, maxItemsPerDocument, pageStyle, pdfOptions}: {items: Array<T>, itemLayoutFunction: (item: T) => ReactNode, maxItemsPerDocument: number, pageStyle: {}, pdfOptions: {}}) {

  const [print, setPrint] = useState(false);

  let documents = Math.ceil(items.length / maxItemsPerDocument);
  const documentItems = [];
  for( let i=0 ; i < documents; i++){
    documentItems.push(items.slice((0 + i)*maxItemsPerDocument, (1 + i)*maxItemsPerDocument))
  }

  useEffect(() => {
    if(print) {
      setPrint(false);
    }
  }, [print]);

  const handleDownloadPDF = () =>{
    setPrint(true);
  }

  return (
    <div>
      
      <Button onClick={handleDownloadPDF}>Download PDF</Button>
      
      <div style={{position: "fixed", top: "200vh"}}>
        {documentItems.map((partialItems, index) => (
          <PrintPartialList key={index} items={partialItems} itemLayoutFunction={itemLayoutFunction} pageStyle={pageStyle} print={print} pdfOptions={pdfOptions}/>
        ))}
      </div>

    </div>
  );
}