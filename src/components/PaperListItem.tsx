import { Paper } from "@mui/material";

export default function PaperlistItem({children, onClick}: {children: React.ReactNode, onClick?: () => void}){
  return (
    <Paper style={{margin: "1em"}} onClick={onClick}>
      <div style={{margin: "1em"}}>
        {children}
      </div>
    </Paper>
  )
}