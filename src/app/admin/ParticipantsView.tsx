import { useEffect, useState } from "react";
import { Category, Participant } from "@/domain";
import { adminUseCases } from "@/factory";

import { Button, Dialog, IconButton, MenuItem, Select, TextField } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import QrCodeIcon from "@mui/icons-material/QrCode";

import PaperlistItem from "@/components/PaperListItem";
import QRCode from "react-qr-code";
import PrintParticipants from "./PrintParticipants";


export default function ParticipantsView() {


  const [participants, setParticipants] = useState<Array<Participant>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [editParticipantDialogOpen, setEditParticipantDialogOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant|null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrParticipant, setQrParticipant] = useState<Participant | null>(null);


  useEffect(() => {
    adminUseCases.useParticipants((val) => setParticipants(val));
  }, [])

  useEffect(() => {
    adminUseCases.useCategories((val) => setCategories(val));
  }, [])

  const categoriesMap: {[key: string]: Category} = categories.reduce((accumulator, val) => ({...accumulator, [val.id]: val}), {})

  const saveParticipant = () => {
    if(editParticipant === null) {
      return
    }

    if( editParticipant.id === "" ){
      // new participant
      if(editParticipant.category === undefined){
        return
      }

      adminUseCases.addParticipant(editParticipant.code, editParticipant.name, editParticipant.category);
      return
    }

    adminUseCases.storeParticipant(editParticipant)
  }

  const closeQrDialog = () => {
    setQrParticipant(null)
    setQrDialogOpen(false);
  }

  return (
    <div>
      <h1>Deelnemers</h1>

      <div>
        {participants.map(participant => (
          <div key={participant.id}>
            <PaperlistItem onClick={() => {setEditParticipant(participant); setEditParticipantDialogOpen(true)}}>
              <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                <div style={{width: "5%"}}>
                  {participant.code}
                </div>
                <div style={{flexGrow: 1, width: "30%"}}>
                  {participant.name}
                </div>
                <div style={{flexGrow: 1, width: "30%"}}>
                  {participant.category === undefined ? "" : participant.category.name}
                </div>
                <div>
                  <IconButton onClick={(e)=> {e.stopPropagation(); setQrParticipant(participant); setQrDialogOpen(true)}}>
                    <QrCodeIcon ></QrCodeIcon>
                  </IconButton>
                </div>
              </div>
            </PaperlistItem>
          </div>
        ))}
      </div>

      <IconButton onClick={()=> {setEditParticipant({id: "", name: "", code: (participants.length+1).toString(), category: categories[0], judgedBy: []}); setEditParticipantDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <PrintParticipants participants={participants}/>


      <Dialog open={editParticipantDialogOpen} onClose={()=> setEditParticipantDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>

            <TextField label="Nummer" value={editParticipant===null ? "" : editParticipant.code} onChange={(e) => setEditParticipant(val => (val===null ? null : {...val, code: e.target.value}))}/>
            
            <TextField label="Naam" value={editParticipant===null ? "" : editParticipant.name} onChange={(e) => setEditParticipant(val => (val===null ? null : {...val, name: e.target.value}))}/>
            
            <Select label="Category" value={editParticipant===null ? undefined : editParticipant.category?.id} onChange={(e)=> setEditParticipant(val => (val===null ? null : {...val, category: categoriesMap[e.target.value]}))} >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>
              ))}
            </Select>
          
          </div>
          <div>
            <Button onClick={() => {saveParticipant(); setEditParticipantDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditParticipantDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={qrDialogOpen} onClose={closeQrDialog}>
        {qrParticipant !== null && (
          <div style={{margin: "1em"}}>
            <div>
              {qrParticipant.name}
            </div>
            <QRCode value={qrParticipant.id} style={{maxWidth: "160px", width: "100%", height: "auto"}}/>

            <div>
              <Button onClick={closeQrDialog}>close</Button>
            </div>
          </div>
        )}
      </Dialog>

    </div>
  );
}