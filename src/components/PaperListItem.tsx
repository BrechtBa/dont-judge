import { Paper } from "@mui/material";

export default function PaperlistItem({children, onClick}: {children: React.ReactNode, onClick?: () => void}){
  return (
    <Paper style={{margin: "1em", cursor: "pointer"}} onClick={onClick}>
      <div style={{margin: "1em", minHeight: "2.5em", display: "flex", alignItems: "center", alignContent: "stretch"}}>
        {children}
      </div>
    </Paper>
  )
}