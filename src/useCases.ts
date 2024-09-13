import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId } from "./domain";


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
      categories: [],
      participants: [],
      judges: []
    }
    this.contestRepository.storeContest(contest);
    return contest;
  }

  addCategoryToContest(contestId: string, name: string): Category {
    const category = {
      id: generateId(),
      name: name,
    }
    this.contestRepository.storeCategory(contestId, category);
    return category;
  }

  addParticipantToContest(contestId: string, category: Category, name: string): Participant {
    const participant = {
      id: generateId(),
      name: name,
      category: category
    }
    this.contestRepository.storeParticipant(contestId, participant);
    return participant;
  }

  addJudgeToContest(contestId: string): Judge{
    const id = generateId();
    const key = generateId();

    this.judgesRepository.createJudge(contestId, id, key);
    const judge = {
      id: id,
      name: "",
    }
    this.contestRepository.storeJudge(contestId, judge, key);
    return judge
  }

  getJudgeKey(id: string, callback: (key: string | null) => void): void {
    this.contestRepository.getJudgeKey(id)
    .then(key => callback(key));
  }

  useContests(callback: (contests: Array<Contest>) => void): void {
    this.contestRepository.onContestsChanged(callback)
  }

}


export class JudgeUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
  }

  authenticate(contestId: string, id: string, key: string): void {
    this.judgesRepository.authenticate(contestId, id, key)
  }

  signOut(): void {
    this.judgesRepository.signOut();
  }

  useIsAuthenticated(callback: (authenticated: boolean) => void) {
    this.judgesRepository.onAuthenticatedChanged(callback)
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
}

