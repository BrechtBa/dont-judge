import { useEffect, useState } from "react"

import { IconButton, Dialog, Button, TextField } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import QrCodeIcon from "@mui/icons-material/QrCode";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ExpandLess from "@mui/icons-material/ExpandLess";

import { adminUseCases } from "@/factory";
import { Judge, Participant } from "@/domain";
import QRCode from "react-qr-code";
import PrintJudges from "./PrintJudges";
import PaperlistItem from "@/components/PaperListItem";


function JudgeRow({judge, setEditJudge, setEditJudgeDialogOpen}: 
  {judge: Judge, 
    setEditJudge: (judge: Judge) => void, setEditJudgeDialogOpen: (open: boolean) => void}) {

  const [expanded, setExpanded] = useState(false);

  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrData, setQrData] = useState<null | {url: string, contestId: string, judgeId: string, judgeKey: string}>(null);

  const [participantScoreData, setParticipantScoreData] = useState<null | Array<{participant: Participant, total: number, scoreAreas: {[scoreAreaId: string]: number}}>>(null);
  
  useEffect(() => {
    if(!qrDialogOpen) {
      setQrData(null);
      return
    }
    adminUseCases.useJudgeQrCodeData(judge, (val) => {
      setQrData(val)
    });
  }, [qrDialogOpen])

  useEffect(() => {
    if(!expanded) {
      return
    }
    adminUseCases.useJudgeParticipantScores(judge.id, (data) => {
      setParticipantScoreData(data)
    });
  }, [expanded])
  


  const closeQrDialog = () => {
    setQrDialogOpen(false);
  } 

  const shareQrData = () => {
    if (qrData === null) {
      return;
    }

    if(navigator.share) {
      navigator.share({url: qrData.url});
    }
    else if(navigator.clipboard) {
      navigator.clipboard.writeText(qrData.url);
    }
  }

  return (
      <div style={{width: "100%"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center", width: "100%"}}>
          {expanded && (
            <IconButton onClick={(e)=> {e.stopPropagation(); setExpanded(false)}}>
              <ExpandLess></ExpandLess>
            </IconButton>
          )}

          {!expanded && (
            <IconButton onClick={(e)=> {e.stopPropagation(); setExpanded(true)}}>
              <ExpandMore></ExpandMore>
            </IconButton>
        
          )}     

          <div style={{flexGrow: 1}} onClick={() => {setEditJudge(judge); setEditJudgeDialogOpen(true)}}>
            {judge.name}
          </div>
          <div>
            <IconButton onClick={(e)=> {e.stopPropagation(); setQrDialogOpen(true)}}>
              <QrCodeIcon></QrCodeIcon>
            </IconButton>
          </div>
        </div>

        {expanded && (
          <div>
            <div style={{display: "flex", flexDirection: "row", color: "var(--less-important-color)", paddingLeft: "2em"}}>
              <div style={{flexGrow: 1}}>Groep</div>
              <div>Totaal</div>
            </div>
            {participantScoreData?.map(val => (
              <div key={val.participant.id} style={{display: "flex", flexDirection: "row", color: "var(--less-important-color)", paddingLeft: "2em"}}>
                <div style={{width: "3em"}}>{val.participant.code}</div>
                <div style={{flexGrow: 1}}>{val.participant.name}</div>
                <div>{val.total}</div>
              </div>
            ))}
          </div>
        )}


        <Dialog open={qrDialogOpen} onClose={closeQrDialog}>
          {judge !== null  && qrData !==null && (
            <div style={{margin: "1em"}}>
              <div>
                {judge.name}
              </div>
              <div style={{width: "100%", display: "flex", justifyContent: "center"}}>
              <QRCode value={qrData.url} style={{maxWidth: "200px", width: "100%", height: "auto", margin: "1em"}}/>

              </div>
              
              <div>
                <div>Wedstrijd Id: {qrData.contestId}</div>
                <div>Jury Id: {qrData.judgeId}</div>
                <div>Authenticatie Key: {qrData.judgeKey}</div>
              </div>
              <div>
                <a href="#" onClick={() => shareQrData()} style={{textDecoration: "underline"}}>share</a>
              </div>
              <div>
                <Button onClick={closeQrDialog}>close</Button>
              </div>
            </div>
          )}
        </Dialog>

      </div>
  );



}




export default function JudgesView(){

  const [judges, setJudges] = useState<Array<Judge>>([]);
  const [editJudgeDialogOpen, setEditJudgeDialogOpen] = useState(false);
  const [editJudge, setEditJudge] = useState<Judge | null>(null);
  const [deleteJudgeDialogOpen, setDeleteJudgeDialogOpen] = useState(false);


  useEffect(() => {
    adminUseCases.useJudges((val) => setJudges(val));
  }, [])

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

  return (
    <div>
      <h1>Juryleden</h1>

      <div>
        {judges.map(judge => (
          <div key={judge.id}>
            <PaperlistItem>
              <JudgeRow judge={judge} setEditJudge={setEditJudge} setEditJudgeDialogOpen={setEditJudgeDialogOpen}/>
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

    </div>
  );
}