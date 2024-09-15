import { Route, Routes } from 'react-router-dom';


import './App.css'

import AdminView from './admin/Admin';
import JudgeView from './judge/Judge';


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
