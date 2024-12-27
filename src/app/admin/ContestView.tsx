import { useEffect, useState } from "react"
import { Button, Dialog, TextField, IconButton, FormControlLabel, Checkbox } from "@mui/material"
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

import PaperlistItem from "@/components/PaperListItem"

import { Category, Contest, Ranking, ScoreArea } from "@/domain"
import { adminUseCases, viewUseCases } from "@/factory"


export default function ContestView() {

  const [contest, setContest] = useState<Contest | null>(null)
  const [editContestDialogOpen, setEditContestDialogOpen] = useState(false);
  const [editContest, setEditContest] = useState<Contest | null>(null);

  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
 
  const [editScoreAreaDialogOpen, setEditScoreAreaDialogOpen] = useState(false);
  const [editScoreArea, setEditScoreArea] = useState<ScoreArea | null>(null);
  const [deleteScoreAreaDialogOpen, setDeleteScoreAreaDialogOpen] = useState(false);

  const [editRankingDialogOpen, setEditRankingDialogOpen] = useState(false);
  const [editRanking, setEditRanking] = useState<Ranking | null>(null);
  const [deleteRankingDialogOpen, setDeleteRankingDialogOpen] = useState(false);


  useEffect(() => {
    adminUseCases.useActiveContest(contest => setContest(contest))
  }, [])

  if( contest === null){
    return null;
  }

  const saveContest = () => {
    if( editContest === null ){
      return;
    }
    const newContest = {
      ...contest,
      name: editContest.name,
    };
    adminUseCases.storeContest(newContest);
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

  const deleteCategory = () => {
    if( editCategory === null ){
      return;
    }
    const newContest = {
      ...contest,
    };
    delete newContest.categories[editCategory.id];
    // FIXME remove from rankings
    adminUseCases.storeContest(newContest);
  }

  const saveScoreArea = () => {
    if( editScoreArea === null ){
      return;
    }

    if( editScoreArea.id === "" ){
      adminUseCases.addScoreArea(contest, editScoreArea.name, editScoreArea.comment, editScoreArea.maximumScore);
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

  const deleteScoreArea = () => {
    if( editScoreArea === null ){
      return;
    }
    const newContest = {
      ...contest,
    };
    delete newContest.scoreAreas[editScoreArea.id];
    // FIXME remove from rankings
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

  const deleteRanking = () => {
    if( editRanking === null ){
      return;
    }
    const newContest = {
      ...contest,
    };
    delete newContest.rankings[editRanking.id];
    adminUseCases.storeContest(newContest);
  }

  return (
    <div>
      <h1>Wedstrijd</h1>
      
      <PaperlistItem onClick={()=> {setEditContest(contest); setEditContestDialogOpen(true);}}>
        <div>{contest.name}</div>
        <div>logo</div>
      </PaperlistItem>

      <Dialog open={editContestDialogOpen} onClose={()=> setEditContestDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editContest===null ? "" : editContest.name} onChange={(e) => setEditContest(val => (val===null ? null : {...val, name: e.target.value}))}/>
          </div>
          <div>
            <Button onClick={() => {saveContest(); setEditContestDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditContestDialogOpen(false)}>cancel</Button>
          </div>
        </div>
      </Dialog>

      <h1>Thema's</h1>
      <div>
        {viewUseCases.getSortedCategories(contest).map(category => (
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
            <Button onClick={() => {setEditCategoryDialogOpen(false); setDeleteCategoryDialogOpen(true);}} color="error">delete</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteCategoryDialogOpen} onClose={()=> setDeleteCategoryDialogOpen(false)}>
        {editCategory !== null && (
        <div style={{margin: "1em"}}>
          <div>
            <div>Wil je dit thema echt verwijderen? </div>
            <div>{editCategory.name}</div>
          </div>
          <div>
            <Button onClick={() => setDeleteCategoryDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {deleteCategory(); setDeleteCategoryDialogOpen(false);}} color="error">delete</Button>
          </div>
        </div>
        )}
      </Dialog>

      <h1>Scores</h1>
      <div>
        {viewUseCases.getSortedScoreAreas(contest).map(scoreArea => (
          <PaperlistItem key={scoreArea.id} onClick={()=> {setEditScoreArea(scoreArea); setEditScoreAreaDialogOpen(true);}}>
            <div style={{display: "flex", width: "100%"}}>
              <div style={{flexGrow: 1}}>{scoreArea.name}</div>
              <div>{scoreArea.maximumScore}</div>
            </div>
          </PaperlistItem>
        ))}
      </div>

      <IconButton onClick={()=> {setEditScoreArea({id: "", name: "", comment: "", maximumScore: 10}); setEditScoreAreaDialogOpen(true)}}>
        <AddCircleOutlineIcon></AddCircleOutlineIcon>
      </IconButton>
     
      <Dialog open={editScoreAreaDialogOpen} onClose={()=> setEditScoreAreaDialogOpen(false)}>
        <div style={{margin: "1em"}}>
          <div style={{display: "flex", flexDirection: "column", gap: "1em"}}>
            <TextField label="Naam" value={editScoreArea===null ? "" : editScoreArea.name} onChange={(e) => setEditScoreArea(val => (val===null ? null : {...val, name: e.target.value}))}/>
            <TextField label="Uitleg" value={editScoreArea===null ? "" : editScoreArea.comment} onChange={(e) => setEditScoreArea(val => (val===null ? null : {...val, comment: e.target.value}))}/>
            <TextField label="Maximum score" type="number" value={editScoreArea===null ? "" : editScoreArea.maximumScore} onChange={(e) => setEditScoreArea(val => (val===null ? null : {...val, maximumScore: parseFloat(e.target.value)}))}/>
          </div>
          <div>
            <Button onClick={() => {saveScoreArea(); setEditScoreAreaDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditScoreAreaDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {setEditScoreAreaDialogOpen(false); setDeleteScoreAreaDialogOpen(true);}} color="error">delete</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteScoreAreaDialogOpen} onClose={()=> setDeleteScoreAreaDialogOpen(false)}>
        {editScoreArea !== null && (
        <div style={{margin: "1em"}}>
          <div>
            <div>Wil je deze score echt verwijderen? </div>
            <div>{editScoreArea.name}</div>
          </div>
          <div>
            <Button onClick={() => setDeleteScoreAreaDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {deleteScoreArea(); setDeleteScoreAreaDialogOpen(false);}} color="error">delete</Button>
          </div>
        </div>
        )}
      </Dialog>

      <h1>Rankings</h1>
      <div>
        {viewUseCases.getSortedRankings(contest).map(ranking => (
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
              {viewUseCases.getSortedScoreAreas(contest).map(scoreArea => (
                <FormControlLabel key={scoreArea.id} control={<Checkbox checked={editRanking===null ? false : editRanking.scoreAreas[scoreArea.id] || false} onChange={() => setEditRanking(val => (val===null ? null : {...val, scoreAreas: {...val.scoreAreas, [scoreArea.id]: !val.scoreAreas[scoreArea.id]}}))}/>} label={scoreArea.name} />
              ))}
            </div>
          </div>
          <div>
            <Button onClick={() => {saveRanking(); setEditRankingDialogOpen(false);}}>save</Button>
            <Button onClick={() => setEditRankingDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {setEditRankingDialogOpen(false); setDeleteRankingDialogOpen(true);}} color="error">delete</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={deleteRankingDialogOpen} onClose={()=> setDeleteRankingDialogOpen(false)}>
        {editRanking !== null && (
        <div style={{margin: "1em"}}>
          <div>
            <div>Wil je deze ranking echt verwijderen? </div>
            <div>{editRanking.name}</div>
          </div>
          <div>
            <Button onClick={() => setDeleteRankingDialogOpen(false)}>cancel</Button>
            <Button onClick={() => {deleteRanking(); setDeleteRankingDialogOpen(false);}} color="error">delete</Button>
          </div>
        </div>
        )}
      </Dialog>

    </div>
  )

}