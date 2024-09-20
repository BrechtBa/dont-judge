import { useEffect, useState } from "react"
import { Button, Dialog, TextField, IconButton, FormControlLabel, Checkbox } from "@mui/material"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import PaperlistItem from "@/components/PaperListItem"

import { Category, Contest, Ranking, ScoreArea } from "@/domain"
import { adminUseCases } from "@/factory"


export default function ContestView() {

  const [contest, setContest] = useState<Contest | null>(null)
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
 
  const [editScoreAreaDialogOpen, setEditScoreAreaDialogOpen] = useState(false);
  const [editScoreArea, setEditScoreArea] = useState<ScoreArea | null>(null);

  const [editRankingDialogOpen, setEditRankingDialogOpen] = useState(false);
  const [editRanking, setEditRanking] = useState<Ranking | null>(null);


  useEffect(() => {
    adminUseCases.useActiveContest(contest => setContest(contest))
  }, [])

  if( contest === null){
    return null;
  }

  const saveCategory = () => {
    if( editCategory === null ){
      return;
    }

    if( editCategory.id === "" ){
      adminUseCases.addCategory(contest, editCategory.name);
      return
    }

    const newContest = {
      ...contest,
      categories: {
        ...contest.categories,
        [editCategory.id]: editCategory
      }
    };
    adminUseCases.storeContest(newContest)
  }

  const saveScoreArea = () => {
    if( editScoreArea === null ){
      return;
    }

    if( editScoreArea.id === "" ){
      adminUseCases.addScoreArea(contest, editScoreArea.name, editScoreArea.maximumScore);
      return
    }

    const newContest = {
      ...contest,
      scoreAreas: {
        ...contest.scoreAreas,
        [editScoreArea.id]: editScoreArea
      }
    };
    adminUseCases.storeContest(newContest);
  }

  const saveRanking = () => {
    if( editRanking === null ){
      return;
    }

    if( editRanking.id === "" ){
      adminUseCases.addRanking(contest, editRanking.name, editRanking.scoreAreas, editRanking.perCategory);
      return
    }

    const newContest = {
      ...contest,
      rankings: {
        ...contest.rankings,
        [editRanking.id]: editRanking
      }
    };
    adminUseCases.storeContest(newContest);
  }

  return (
    <div>
      <h1>Thema's</h1>
      <div>
        {Object.values(contest.categories).sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;}).map(category => (
          <PaperlistItem key={category.id} onClick={()=> {setEditCategory(category); setEditCategoryDialogOpen(true);}}>
            {category.name}
          </PaperlistItem>
        ))}
      </div>

      <IconButton onClick={()=> {setEditCategory({id: "", name: ""}); setEditCategoryDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>
     
      <Dialog open={editCategoryDialogOpen} onClose={()=> setEditCategoryDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editCategory===null ? "" : editCategory.name} onChange={(e) => setEditCategory(val => (val===null ? null : {...val, name: e.target.value}))}/>
          </div>
          <div>
            <Button onClick={() => {saveCategory(); setEditCategoryDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditCategoryDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>


      <h1>Scores</h1>
      <div>
        {Object.values(contest.scoreAreas).sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;}).map(scoreArea => (
          <PaperlistItem key={scoreArea.id} onClick={()=> {setEditScoreArea(scoreArea); setEditScoreAreaDialogOpen(true);}}>
            <div style={{display: "flex", width: "100%"}}>
              <div style={{flexGrow: 1}}>{scoreArea.name}</div>
              <div>{scoreArea.maximumScore}</div>
            </div>
          </PaperlistItem>
        ))}
      </div>

      <IconButton onClick={()=> {setEditScoreArea({id: "", name: "", maximumScore: 10}); setEditScoreAreaDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>
     
      <Dialog open={editScoreAreaDialogOpen} onClose={()=> setEditScoreAreaDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editScoreArea===null ? "" : editScoreArea.name} onChange={(e) => setEditScoreArea(val => (val===null ? null : {...val, name: e.target.value}))}/>
            <TextField label="Maximum score" type="number" value={editScoreArea===null ? "" : editScoreArea.maximumScore} onChange={(e) => setEditScoreArea(val => (val===null ? null : {...val, maximumScore: parseFloat(e.target.value)}))}/>
          </div>
          <div>
            <Button onClick={() => {saveScoreArea(); setEditScoreAreaDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditScoreAreaDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>


      <h1>Rankings</h1>
      <div>
        {Object.values(contest.rankings).sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;}).map(ranking => (
          <PaperlistItem key={ranking.id} onClick={()=> {setEditRanking(ranking); setEditRankingDialogOpen(true);}}>
            <div style={{display: "flex", width: "100%"}}>
              <div style={{flexGrow: 1}}>{ranking.name}</div>
            </div>
          </PaperlistItem>
        ))}
      </div>

      <IconButton onClick={()=> {setEditRanking({id: "", name: "", scoreAreas: {}, perCategory: false}); setEditRankingDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>

      <Dialog open={editRankingDialogOpen} onClose={()=> setEditRankingDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editRanking===null ? "" : editRanking.name} onChange={(e) => setEditRanking(val => (val===null ? null : {...val, name: e.target.value}))}/>
            
            <FormControlLabel control={<Checkbox checked={editRanking===null ? false : editRanking.perCategory} onChange={() => setEditRanking(val => (val===null ? null : {...val, perCategory: !val.perCategory}))}/>} label="Ranking per thema" />
            <div style={{display: "flex", flexDirection: "column"}}>
              {Object.values(contest.scoreAreas).sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;}).map(scoreArea => (
                <FormControlLabel key={scoreArea.id} control={<Checkbox checked={editRanking===null ? false : editRanking.scoreAreas[scoreArea.id] || false} onChange={() => setEditRanking(val => (val===null ? null : {...val, scoreAreas: {...val.scoreAreas, [scoreArea.id]: !val.scoreAreas[scoreArea.id]}}))}/>} label={scoreArea.name} />
              ))}
            </div>
          </div>
          <div>
            <Button onClick={() => {saveRanking(); setEditRankingDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditRankingDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>

    </div>
  )

}