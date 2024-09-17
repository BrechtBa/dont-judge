import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId, Score, ScoreArea, ParticipantScoreData } from "./domain";


export class AdminUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
  }

  createNewContest(name: string): Contest {
    const contest = {
      id: generateId(),
      name: name,
      scoreAreas: {},
      categories: {},
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

  addParticipant(name: string, category: Category): Participant {
    const participant = {
      id: generateId(),
      name: name,
      category: category
    }
    this.storeParticipant(participant);
    return participant;
  }

  storeParticipant(participant: Participant): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.storeParticipant(contestId, participant);
  }

  addJudge(name: string): Judge{
    const contestId = "d23858e1-4d37";  // FIXME
    const id = generateId();
    const key = generateId();

    this.judgesRepository.createJudge(contestId, id, key);
    const judge = {
      id: id,
      name: name,
    }
    this.judgesRepository.storeJudgeKey(contestId, judge, key);
    this.contestRepository.storeJudge(contestId, judge);
    return judge
  }
  storeJudge(judge: Judge): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.storeJudge(contestId, judge);
  }

  getJudgeKey(judgeId: string, callback: (key: string | null) => void): void {
    this.judgesRepository.getJudgeKey(judgeId, callback);
  }

  useContests(callback: (contests: Array<Contest>) => void): void {
    this.contestRepository.onContestsChanged(callback)
  }

  useActiveContest(callback: (contest: Contest) => void){
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.onContestChanged(contestId, callback)
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.onParticipantsChanged(contestId, callback)
  }

  useCategories(callback: (categories: Array<Category>) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.onContestChanged(contestId, contest => callback(Object.values(contest.categories)))
  }

  useJudges(callback: (judges: Array<Judge>) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.onJudgesChanged(contestId, callback)
  }

  useJudgeQrCodeData(judge: Judge, callback: (data: string) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME

    this.judgesRepository.getJudgeKey(judge.id, (judgeKey: string | null) => {
      if(judgeKey === null) {
        callback("");
      }
      callback(`${judge.id}@${contestId}@${judgeKey}`);
    });
  }

  useScores(callback: (scores: Array<Score>, scoreAreas: {[key: string]: ScoreArea}, participants: Array<Participant>, judges: {[key: string]: Judge}) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME

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

  useParticipantScores(callback: (participantScoreData: Array<ParticipantScoreData>, contest: Contest) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME

   
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

            const judgesMap: {[key:  string]: Judge} = judges.reduce((acc, judge) => ({...acc, [judge.id]: judge}), {});

            const participantJudgeScores: {
              [participantId:  string]: {
                [key:  string]: {
                  judge: Judge,
                  total: number,
                  scoreAreas: {
                    [scoreAreaId: string]: number,
                  }
                }
              }
            } = participants.reduce((acc1, participant) => ({
              ...acc1,
              [participant.id]: (participantScoreMap[participant.id] || []).reduce((acc, score) => ({
                ...acc,
                [score.id]: {
                  judge: judgesMap[score.judgeId],
                  total: Object.values(contest.scoreAreas).reduce((acc, scoreArea) => acc + score.score[scoreArea.id] || 0, 0),
                  scoreAreas: {
                    ...Object.values(contest.scoreAreas).reduce((acc, scoreArea) => ({
                      ...acc,
                      [scoreArea.id]: score.score[scoreArea.id] || 0
                    }), {}),
                  }
                }
              }), {})
            }), {});


            const data: Array<ParticipantScoreData> = participants.map((participant: Participant) => ({
              participant: participant,
              totalScore: {
                total: Object.values(participantJudgeScores[participant.id]).reduce((acc, data) => acc + data.total, 0),
                scoreAreas: Object.values(participantJudgeScores[participant.id]).reduce((acc1: {[key: string]: number}, data) => Object.keys(contest.scoreAreas).reduce((acc2, key: string) => ({
                  ...acc2,
                  [key]: (acc1[key] === undefined ? 0 : acc1[key]) + (data.scoreAreas[key] || 0)
                }), {}), {}),
              },
              judgeScores: participantJudgeScores[participant.id]
            }));

            callback(data, contest)

          });
        });
      });
    });

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
    this.contestRepository.onParticipantsChanged(judge.contestId, callback)
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

