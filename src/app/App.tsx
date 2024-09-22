import { Route, Routes } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material';


import './App.css'

import AdminView from './admin/Admin';
import JudgeView from './judge/Judge';


const theme = createTheme({
  palette: {
    primary: {
      main: "#4CAAC9",
      contrastText: '#FFFFFF',
    },
  },
});


function App() {

  return (
    <>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/admin/*" element={<AdminView />} />
          <Route path="/*" element={<JudgeView />} />
        </Routes>
      </ThemeProvider>
    </>
  )
}

export default App
