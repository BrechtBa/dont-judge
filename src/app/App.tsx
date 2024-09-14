import { Link, Outlet, Route, Routes } from 'react-router-dom';
import { Button } from '@mui/material';

import './App.css'


import AdminView from './admin/Admin';
import JudgeView from './judge/Judge';
import { useEffect, useState } from 'react';
import { adminUseCases } from '@/factory';
import { Contest } from '@/domain';


function JudgeViewWrapper() {
  return (
    <div style={{width: "100%", height: "100%", display: "flex", flexDirection: "column"}}>
      <div style={{width: "100%", flexGrow: 1}}>
        <JudgeView />
      </div>

      <div>
        <Link to="/admin"><Button>Admin</Button></Link>
      </div>
    </div>
  );
}


function App() {


  // useEffect(() => {
  //   if(contest === null){
  //     return
  //   }
  //   adminUseCases.getJudgeKey(contest.judges[0].id, (key: string | null) => setJudgeKey(key));
  // }, [contest])


  return (
    <>
      <Routes>
        <Route index element={<JudgeView />} />
        <Route path="/admin/*" element={<AdminView />} />
        <Route path="*" element={<JudgeView />} />
      </Routes>
    </>
  )
}

export default App
