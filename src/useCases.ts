import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId, Score } from "./domain";


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
      scoreCategories: {}
    }
    this.contestRepository.storeContest(contest);
    return contest;
  }

  addCategory(name: string): Category {
    const contestId = "d23858e1-4d37";  // FIXME
    const category = {
      id: generateId(),
      name: name,
    }
    this.contestRepository.storeCategory(contestId, category);
    return category;
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
    this.contestRepository.storeJudgeKey(contestId, judge, key);
    this.contestRepository.storeJudge(contestId, judge);
    return judge
  }
  storeJudge(judge: Judge): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.storeJudge(contestId, judge);
  }

  getJudgeKey(judgeId: string, callback: (key: string | null) => void): void {
    this.contestRepository.getJudgeKey(judgeId, callback);
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
    this.contestRepository.onCategoriesChanged(contestId, callback)
  }

  useJudges(callback: (judges: Array<Judge>) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME
    this.contestRepository.onJudgesChanged(contestId, callback)
  }

  useJudgeQrCodeData(judge: Judge, callback: (data: string) => void): void {
    const contestId = "d23858e1-4d37";  // FIXME

    this.contestRepository.getJudgeKey(judge.id, (judgeKey: string | null) => {
      if(judgeKey === null) {
        callback("");
      }
      callback(`${judge.id}@${contestId}@${judgeKey}`);
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
    this.contestRepository.setParticipantJudgeScore(judge.contestId, participantId, judge.judgeId, score);
    this.contestRepository.setParticipantJudgedBy(judge.contestId, participantId, judge.judgeId, true);
  }

}

