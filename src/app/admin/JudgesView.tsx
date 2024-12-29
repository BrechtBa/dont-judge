import { useEffect, useState } from "react"

import { IconButton, Dialog, Button, TextField } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import QrCodeIcon from "@mui/icons-material/QrCode";

import { adminUseCases } from "@/factory";
import { Judge } from "@/domain";
import QRCode from "react-qr-code";
import PrintJudges from "./PrintJudges";
import PaperlistItem from "@/components/PaperListItem";


export default function JudgesView(){

  const [judges, setJudges] = useState<Array<Judge>>([]);
  const [editJudgeDialogOpen, setEditJudgeDialogOpen] = useState(false);
  const [editJudge, setEditJudge] = useState<Judge | null>(null);
  const [deleteJudgeDialogOpen, setDeleteJudgeDialogOpen] = useState(false);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrJudge, setQrJudge] = useState<Judge | null>(null);
  const [qrData, setQrData] = useState("");



  useEffect(() => {
    adminUseCases.useJudges((val) => setJudges(val));
  }, [])

  useEffect(() => {
    if(qrJudge === null) {
      setQrData("");
      return
    }
    adminUseCases.useJudgeQrCodeData(qrJudge, (val) => {
      setQrData(val)
    });
  }, [qrJudge])


  const saveJudge = () => {
    if(editJudge === null) {
      return
    }

    if( editJudge.id === "" ){
      // new participant
      adminUseCases.addJudge(editJudge.name);
      return
    }
    adminUseCases.storeJudge(editJudge)
  }

  const closeQrDialog = () => {
    setQrJudge(null)
    setQrDialogOpen(false);
  } 

  return (
    <div>
      <h1>Juryleden</h1>


      <div>
        {judges.map(judge => (
          <div key={judge.id}>
            <PaperlistItem onClick={() => {setEditJudge(judge); setEditJudgeDialogOpen(true)}}>
              <div style={{display: "flex", flexDirection: "row", alignItems: "center", width: "100%"}}>
                <div>
                  {judge.name}
                </div>
                <div style={{flexGrow: 1}}></div>
                <div>
                  <IconButton onClick={(e)=> {e.stopPropagation(); setQrJudge(judge); setQrDialogOpen(true)}}>
                    <QrCodeIcon></QrCodeIcon>
                  </IconButton>
                </div>
              </div>
            </PaperlistItem>
          </div>
        ))}
      </div>

      <IconButton onClick={()=> {setEditJudge({id: "", name: ""}); setEditJudgeDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <PrintJudges judges={judges}/>

      <Dialog open={editJudgeDialogOpen} onClose={()=> setEditJudgeDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editJudge===null ? "" : editJudge.name} onChange={(e) => setEditJudge(val => (val===null ? null : {...val, name: e.target.value}))}/>
          </div>
          <div>
            <Button onClick={() => {saveJudge(); setEditJudgeDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditJudgeDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {setEditJudgeDialogOpen(false); setDeleteJudgeDialogOpen(true);}} color="error">delete</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteJudgeDialogOpen} onClose={()=> setDeleteJudgeDialogOpen(false)}>
        {editJudge !== null && (
        <div style={{margin: "1em"}}>
          <div>
            <div>Do you realy want to delete judge </div>
            <div>{editJudge.name}</div>
          </div>
          <div>
            <Button onClick={() => setDeleteJudgeDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {adminUseCases.deleteJudge(editJudge.id); setDeleteJudgeDialogOpen(false);}} color="error">delete</Button>
          </div>
        </div>
        )}
      </Dialog>

      <Dialog open={qrDialogOpen} onClose={closeQrDialog}>
        {qrJudge !== null && (
          <div style={{margin: "1em"}}>
            <div>
              {qrJudge.name}
            </div>
            <QRCode value={qrData} style={{maxWidth: "160px", width: "100%", height: "auto"}}/>

            <div>
              <Button onClick={closeQrDialog}>close</Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
}