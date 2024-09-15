import { useEffect, useState } from "react";
import { Category, Participant } from "@/domain";
import { adminUseCases } from "@/factory";

import { Button, Dialog, IconButton, MenuItem, Paper, Select, TextField } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export default function ParticipantsView() {
  const [participants, setParticipants] = useState<Array<Participant>>([]);
  const [categories, setCategories] = useState<Array<Category>>([]);
  const [editParticipantDialogOpen, setEditParticipantDialogOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant|null>(null);


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

      adminUseCases.addParticipant(editParticipant.name, editParticipant.category);
      return
    }

    adminUseCases.storeParticipant(editParticipant)

  }

  return (
    <div>
      <h1>Deelnemers</h1>

      <div>
        {participants.map(participant => (
          <div key={participant.id}>
            <Paper onClick={() => {setEditParticipant(participant); setEditParticipantDialogOpen(true)}}>
              <div style={{display: "flex", flexDirection: "row", margin: "1em"}}>
                <div>
                  {participant.name}
                </div>
                <div style={{flexGrow: 1}}></div>
                <div>
                  {participant.category === undefined ? "" : participant.category.name}
                </div>
              </div>
            </Paper>
          </div>
        ))}
      </div>

      <IconButton onClick={()=> {setEditParticipant({id: "", name: "", category: categories[0]}); setEditParticipantDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <Dialog open={editParticipantDialogOpen} onClose={()=> setEditParticipantDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
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

    </div>
  );
}