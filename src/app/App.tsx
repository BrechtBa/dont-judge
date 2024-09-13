import { Link, Outlet, Route, Routes } from 'react-router-dom';
import { Button } from '@mui/material';

import './App.css'


import AdminView from './admin/Admin';
import JudgeView from './judge/Judge';


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
  // const [contest, setContest] = useState<Contest | null>(null);
  // const [judgeKey, setJudgeKey] = useState<string | null>(null);

  // useEffect(() => {
  //   adminUseCases.useContests((contests: Array<Contest>) => setContest(contests[0]))
  // }, [])


  // useEffect(() => {
  //   if(contest === null){
  //     return
  //   }
  //   adminUseCases.getJudgeKey(contest.judges[0].id, (key: string | null) => setJudgeKey(key));
  // }, [contest])

  // console.log(contest)
  // console.log(judgeKey)

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
