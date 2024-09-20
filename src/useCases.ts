import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId, Score, ScoreArea, ParticipantScoreData, UsersRepository, RankingData } from "./domain";


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

  selfSignUp(email: string, password: string) {
    const contest = this.createNewContest("");
    this.usersRepository.registerUser(contest.id, email, password, (uid: string) => {
      this.contestRepository.addAdminToContest(contest.id, uid) // FIXME security rules
    });
  }

  sendAdminInvitation(contestId: string, email: string): void {
    this.usersRepository.registerUser(contestId, email, generateId(), (uid: string) => {
      this.contestRepository.addAdminToContest(contestId, uid)
    })
  }
  
  createNewContest(name: string): Contest {
    const contest = {
      id: generateId(),
      name: name,
      scoreAreas: {},
      categories: {},
      rankings: [{
        scoreAreas: {}
      }]
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
    
    const contestId = this.contestRepository.getActiveContestId();
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
    const contestId = this.contestRepository.getActiveContestId();
    this.contestRepository.storeParticipant(contestId, participant);
  }

  addJudge(name: string): Judge{
    const contestId = this.contestRepository.getActiveContestId();
    const id = generateId();
    const key = generateId();

    this.judgesRepository.createJudge(contestId, id, key);
    const judge = {
      id: id,
      name: name,
    }
    this.contestRepository.storeJudge(contestId, judge);
    return judge
  }
  storeJudge(judge: Judge): void {
    const contestId = this.contestRepository.getActiveContestId();
    this.contestRepository.storeJudge(contestId, judge);
  }

  getJudgeKey(judgeId: string, callback: (key: string | null) => void): void {
    const contestId = this.contestRepository.getActiveContestId();
    this.judgesRepository.getJudgeKey(contestId, judgeId, callback);
  }

  useContests(callback: (contests: Array<Contest>) => void): void {
    this.contestRepository.onContestsChanged(callback)
  }

  useActiveContest(callback: (contest: Contest) => void){
    const contestId = this.contestRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, callback)
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const contestId = this.contestRepository.getActiveContestId();
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
    const contestId = this.contestRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, contest => callback(Object.values(contest.categories)))
  }

  useJudges(callback: (judges: Array<Judge>) => void): void {
    const contestId = this.contestRepository.getActiveContestId();
    this.contestRepository.onJudgesChanged(contestId, callback)
  }

  useJudgeQrCodeData(judge: Judge, callback: (data: string) => void): void {
    const contestId = this.contestRepository.getActiveContestId();

    this.judgesRepository.getJudgeKey(contestId, judge.id, (judgeKey: string | null) => {
      if(judgeKey === null) {
        callback("");
      }
      callback(`${judge.id}@${contestId}@${judgeKey}`);
    });
  }

  useScores(callback: (scores: Array<Score>, scoreAreas: {[key: string]: ScoreArea}, participants: Array<Participant>, judges: {[key: string]: Judge}) => void): void {
    const contestId = this.contestRepository.getActiveContestId();

    this.contestRepository.onContestChanged(contestId, (contest: Contest) => {
      this.contestRepository.onJudgesChanged(contestId, (judges: Array<Judge>) => {
        this.contestRepository.onParticipantsChanged(contestId, (participants: Array<Participant>) => {
          this.contestRepository.onScoresChanged(contestId, (scores: Array<Score>) => {

            callback(scores, contest.scoreAreas, participants, judges.reduce((accumulator, val) => ({...accumulator, [val.id]: val}), {}));
            
          });
        });
      });
    });
  }

  useParticipantScores(callback: (rankingData: Array<RankingData>, contest: Contest) => void): void {
    const contestId = this.contestRepository.getActiveContestId();
   
    this.contestRepository.onContestChanged(contestId, (contest: Contest) => {
      this.contestRepository.onJudgesChanged(contestId, (judges: Array<Judge>) => {
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
              }> = contest.rankings.map(ranking => 
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

            const data: Array<RankingData> = contest.rankings.map((ranking, index) => ({
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
            }));

            callback(data, contest)

          });
        });
      });
    });

  }

  deleteParticipant(participantId: string) {
    const contestId = this.contestRepository.getActiveContestId();
   
    this.contestRepository.deleteParticipant(contestId, participantId);
    this.contestRepository.deleteAllParticipantScores(contestId, participantId);
  }

  deleteJudge(judgeId: string) {
    const contestId = this.contestRepository.getActiveContestId();
   
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
      if(a.judgedBy.indexOf(judge.judgeId) === -1 && b.judgedBy.indexOf(judge.judgeId) > -1) {
        return -1
      }
      if(a.judgedBy.indexOf(judge.judgeId) > -1 && b.judgedBy.indexOf(judge.judgeId) === -1) {
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
    this.contestRepository.getParticipantJudgeScore(judge.contestId, participantId, judge.judgeId, callback)
  }

  setScore(participantId: string, score: {[key: string]: number}){
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if( judge === null ) {
      return
    }
    this.contestRepository.storeParticipantJudgeScore(judge.contestId, participantId, judge.judgeId, score);
    this.contestRepository.storeParticipantJudgedBy(judge.contestId, participantId, judge.judgeId, true);
  }

}

