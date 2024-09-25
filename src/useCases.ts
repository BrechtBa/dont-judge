import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId, Score, ScoreArea, UsersRepository, RankingData, Ranking, User } from "./domain";


export class AdminUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;
  private usersRepository: UsersRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository, usersRepository: UsersRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
    this.usersRepository = usersRepository;
  }

  authenticate(email: string, password: string): void {
    this.usersRepository.authenticate(email, password);
  }

  signOut(): void {
    this.usersRepository.signOut();
  }

  useIsAuthenticated(callback: (authenticated: boolean) => void) {
    this.usersRepository.onAuthenticatedChanged(callback)
  }

  getAuthenticatedUserEmail(): string {
    return this.usersRepository.getAuthenticatedUserEmail()
  }

  selfSignUp(email: string, password: string) {
    const contestId = generateId();
    this.usersRepository.registerUser(contestId, email, password, (user: User) => {
      this.createNewContest(contestId, "");
      this.contestRepository.addAdminToContest(contestId, user) // FIXME security rules
    });
  }

  sendAdminInvitation(contestId: string, email: string): void {
    this.usersRepository.registerUser(contestId, email, generateId(), (user: User) => {
      this.contestRepository.addAdminToContest(contestId, user)
    })
  }
  
  createNewContest(contestId: string, name: string): Contest {
    const rankingId = generateId();
    const scoreAreaId = generateId();
    const categoryId = generateId();
    const contest: Contest = {
      id: contestId,
      name: name,
      scoreAreas: {
        [scoreAreaId]: {
          id: scoreAreaId,
          name: "Score gebied",
          maximumScore: 5
        }
      },
      categories: {
        [categoryId]: {
          id: categoryId,
          name: "Thema"
        }
      },
      rankings: {
        [rankingId]: {
          id: rankingId,
          name: "Rangschikking",
          perCategory: false,
          scoreAreas: {
            scoreAreaId: true
          },
        }
      }
    }
    this.contestRepository.storeContest(contest);
    return contest;
  }

  storeContest(contest: Contest): void {
    this.contestRepository.storeContest(contest);
  }
  
  addCategory(contest: Contest, name: string): void {
    const category = {
      id: generateId(),
      name: name,
    }
    const newContest: Contest = {
      ...contest,
      categories: {
        ...contest.categories,
        [category.id]: category,
      }
    }
    this.storeContest(newContest);
  }

  deleteCategory(contest: Contest, categoryId: string){
    const newContest: Contest = {
      ...contest,
      categories: Object.entries(contest.categories).reduce((acc, [key, val]) => {
        if(key === categoryId) {
          return acc;
        }
        return {...acc, [key]: val}
      }, {})
    }
    this.contestRepository.storeContest(newContest);
    
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.deleteCategoryFromAllScoreEntries(contestId, categoryId);
  }

  addScoreArea(contest: Contest, name: string, maximumScore: number): void {
    const scoreArea = {
      id: generateId(),
      name: name,
      maximumScore: maximumScore,
    }
    const newContest: Contest = {
      ...contest,
      scoreAreas: {
        ...contest.scoreAreas,
        [scoreArea.id]: scoreArea,
      }
    }
    this.storeContest(newContest);
  }

  addRanking(contest: Contest, name: string, scoreAreas: {[key: string]: boolean}, perCategory: boolean): void {
    const ranking = {
      id: generateId(),
      name: name,
      scoreAreas: scoreAreas,
      perCategory: perCategory
    }
    const newContest: Contest = {
      ...contest,
      rankings: {
        ...contest.rankings,
        [ranking.id]: ranking,
      }
    }
    this.storeContest(newContest);
  }

  addParticipant(code: string, name: string, category: Category): Participant {
    const participant = {
      id: generateId(),
      code: code,
      name: name,
      category: category,
      judgedBy: [],
    }
    this.storeParticipant(participant);
    return participant;
  }

  storeParticipant(participant: Participant): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.storeParticipant(contestId, participant);
  }

  addJudge(name: string): Judge{
    const contestId = this.usersRepository.getActiveContestId();
    const id = generateId();
    const key = generateId();

    this.judgesRepository.createJudge(contestId, id, key);
    const judge = {
      id: id,
      name: name,
    }
    this.judgesRepository.storeJudge(contestId, judge);
    return judge
  }

  storeJudge(judge: Judge): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.judgesRepository.storeJudge(contestId, judge);
  }

  useActiveContest(callback: (contest: Contest) => void){
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, callback)
  }

  useActiveContestAdmins(callback: (users: Array<User>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onAdminsChanged(contestId, userIds => {
      this.usersRepository.onUsersChanged(userIds, callback)
    })
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    const sortFunction = (a: Participant, b: Participant) => {
      let aCode: number | string = a.code;
      let bCode: number | string = b.code;
      try {
        aCode = parseFloat(a.code);
        bCode = parseFloat(b.code);
      }
      catch {};

      if (aCode > bCode){
        return 1;
      }
      if (aCode < bCode){
        return -1;
      }
      return 0;
    }

    this.contestRepository.onParticipantsChanged(contestId, (particpants) => {
      callback(particpants.sort(sortFunction));
    })
  }

  useCategories(callback: (categories: Array<Category>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, contest => callback(Object.values(contest.categories)))
  }

  useJudges(callback: (judges: Array<Judge>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.judgesRepository.onJudgesChanged(contestId, judges => callback(judges.sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;})));
  }

  useJudgeQrCodeData(judge: Judge, callback: (data: string) => void): void {
    const contestId = this.usersRepository.getActiveContestId();

    this.judgesRepository.getJudgeKey(contestId, judge.id, (judgeKey: string | null) => {
      if(judgeKey === null) {
        callback("");
      }
      callback(`${judge.id}@${contestId}@${judgeKey}`);
    });
  }

  useParticipantScores(callback: (rankingData: {[key: string]: RankingData}, contest: Contest) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.contestRepository.onContestChanged(contestId, (contest: Contest) => {
      this.judgesRepository.onJudgesChanged(contestId, (judges: Array<Judge>) => {
        this.contestRepository.onParticipantsChanged(contestId, (participants: Array<Participant>) => {
          this.contestRepository.onScoresChanged(contestId, (scores: Array<Score>) => {

            let participantScoreMap: {[key: string]: Array<Score>} = {}

            scores.forEach(score => {
              if( participantScoreMap[score.participantId] === undefined ) {
                participantScoreMap[score.participantId] = [];
              }
              participantScoreMap[score.participantId].push(score);
            })
            let numberOfParticipantScores: {[key: string]: number} = Object.entries(participantScoreMap).reduce((acc, [key, val]) => ({...acc, [key]: val.length}), {})

            const judgesMap: {[key:  string]: Judge} = judges.reduce((acc, judge) => ({...acc, [judge.id]: judge}), {});

            const participantJudgeScores: Array<{
                [participantId:  string]: {
                  [key:  string]: {
                    judge: Judge,
                    total: number,
                    scoreAreas: {
                      [scoreAreaId: string]: number,
                    }
                  }
                }
              }> = Object.values(contest.rankings).map(ranking => 
                participants.reduce((acc1, participant) => ({
                  ...acc1,
                  [participant.id]: (participantScoreMap[participant.id] || []).reduce((acc, score) => ({
                    ...acc,
                    [score.id]: {
                      judge: judgesMap[score.judgeId],
                      total: Object.values(contest.scoreAreas).filter(scoreArea => ranking.scoreAreas[scoreArea.id]).reduce((acc, scoreArea) => acc + (score.score[scoreArea.id] || 0), 0),
                      scoreAreas: {
                        ...Object.values(contest.scoreAreas).filter(scoreArea => ranking.scoreAreas[scoreArea.id]).reduce((acc, scoreArea) => ({
                          ...acc,
                          [scoreArea.id]: score.score[scoreArea.id] || 0
                        }), {}),
                      }
                    }
                  }), {})
                }), {})
            )

            const data: {[key: string]: RankingData} = Object.values(contest.rankings).map((ranking, index) => ({
              ranking: ranking,
              participantScoreData: participants.map((participant: Participant) => ({
                participant: participant,
                totalScore: {
                  total: Object.values(participantJudgeScores[index][participant.id]).reduce((acc, data) => acc + data.total/ (numberOfParticipantScores[participant.id] || 1), 0),
                  scoreAreas: Object.values(participantJudgeScores[index][participant.id]).reduce((acc1: {[key: string]: number}, data) => Object.keys(contest.scoreAreas).filter(key => ranking.scoreAreas[key]).reduce((acc2, key: string) => ({
                    ...acc2,
                    [key]: (acc1[key] === undefined ? 0 : acc1[key]) + (data.scoreAreas[key] || 0) / (numberOfParticipantScores[participant.id] || 1)
                  }), {}), {}),
                },
                judgeScores: participantJudgeScores[index][participant.id]
              }))
            })).reduce((acc, val) => ({...acc, [val.ranking.id]: val}), {});

            callback(data, contest)

          });
        });
      });
    });

  }

  deleteParticipant(participantId: string) {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.contestRepository.deleteParticipant(contestId, participantId);
    this.contestRepository.deleteAllParticipantScores(contestId, participantId);
  }

  deleteJudge(judgeId: string) {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.judgesRepository.deleteJudge(contestId, judgeId);
    this.judgesRepository.deleteJudgeKey(contestId, judgeId);
    this.contestRepository.deleteAllJudgeScores(contestId, judgeId);
  }
}


export class JudgeUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
  }

  authenticate(contestId: string, judgeId: string, key: string): void {
    this.judgesRepository.authenticate(contestId, judgeId, key)
  }

  authenticateWithQrData(data: string): void {
    const [judgeId, contestId, key] = data.split("@");
    this.authenticate(contestId, judgeId, key)
  }

  signOut(): void {
    this.judgesRepository.signOut();
  }

  getAuthenticatedJudge(): Judge | null {
    const val = this.judgesRepository.getAuthenticatedJudge();
    if(val === null) {
      return null;
    }
    return val.judge;
  }

  useIsAuthenticated(callback: (authenticated: boolean) => void) {
    this.judgesRepository.onAuthenticatedChanged(callback)
  }

  useActiveContest(callback: (contest: Contest) => void){
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    this.contestRepository.onContestChanged(judge.contestId, callback)
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }

    const sortFunction = (a: Participant, b: Participant) => {
      if(a.judgedBy.indexOf(judge.judge.id) === -1 && b.judgedBy.indexOf(judge.judge.id) > -1) {
        return -1
      }
      if(a.judgedBy.indexOf(judge.judge.id) > -1 && b.judgedBy.indexOf(judge.judge.id) === -1) {
        return 1
      }
      return a.judgedBy.length - b.judgedBy.length;
    }

    this.contestRepository.onParticipantsChanged(judge.contestId, (participants) => {
      callback(participants.sort(sortFunction))
    });
  }

  useParticipant(participantId: string, callback: (particpants: Participant) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    this.contestRepository.onParticipantChanged(judge.contestId, participantId, callback)
  }

  getScore(participantId: string, callback: (score: Score) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    this.contestRepository.getParticipantJudgeScore(judge.contestId, participantId, judge.judge.id, callback)
  }

  setScore(participantId: string, score: {[key: string]: number}){
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    this.contestRepository.storeParticipantJudgeScore(judge.contestId, participantId, judge.judge.id, score);
    this.contestRepository.storeParticipantJudgedBy(judge.contestId, participantId, judge.judge.id, true);
  }
  updateProfile(newJudge: Judge){
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    if(judge.judge.id !== newJudge.id){
      return
    }
    this.judgesRepository.storeJudge(judge.contestId, newJudge);
    this.judgesRepository.setAuthenticatedJudge(newJudge);
  }
}


export class ViewUseCases {

  getSortedCategories(contest: Contest): Array<Category> {
    return Object.values(contest.categories).sort((a, b) => {
      if(a.name > b.name) return 1; 
      if(a.name < b.name) return -1; 
      return 0;
    })
  }

  getSortedRankings(contest: Contest): Array<Ranking> {
    return Object.values(contest.rankings).sort((a, b) => {
      if(a.name > b.name) return 1; 
      if(a.name < b.name) return -1; 
      return 0;
    })
  }

  getSortedScoreAreas(contest: Contest): Array<ScoreArea>{
    const sortedRankings = this.getSortedRankings(contest);

    return Object.values(contest.scoreAreas).sort((a: ScoreArea, b: ScoreArea): number => {
      const totalCountA = sortedRankings.reduce((acc, ranking, index) => ranking.scoreAreas[a.id] ? {total: acc.total+index, count: acc.count+1} : acc, {total: 0, count: 0});
      const totalCountB = sortedRankings.reduce((acc, ranking, index) => ranking.scoreAreas[b.id] ? {total: acc.total+index, count: acc.count+1} : acc, {total: 0, count: 0});
  
      let valA = totalCountA.count === 0 ? -1 : totalCountA.total / totalCountA.count;
      let valB = totalCountB.count === 0 ? -1 : totalCountB.total / totalCountB.count;
 
      if(valA > valB) {
        return 1;
      }
      if(valA < valB) {
        return -1;
      }
      if(a.name > b.name) {
        return 1;
      }
      if(a.name < b.name) {
        return -1;
      }
      return 0;
    });
  }
}
