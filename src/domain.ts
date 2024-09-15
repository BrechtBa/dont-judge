

export interface Category {
  id: string;
  name: string;
}


export interface Participant {
  id: string;
  name: string;
  category: Category | undefined;
}


export interface ScoreCategory {
  id: string;
  name: string;
  maximumScore: number;
}


export interface Judge {
  id: string;
  name: string;
}


export interface Contest {
  id: string;
  name: string;
  scoreCategories: {[key: string]: ScoreCategory};
}


export interface Score {
  id: string;
  participantId: string;
  judgeId: string;
  score: {[key: string]: number};
}


export interface FullScore {
  id: string;
  participant: Participant;
  judge: Judge;
  score: {
    [key: string]: {
      category: ScoreCategory,
      score: number
    }
  };
}


export interface ContestRepository {
  storeContest(contest: Contest): void;
  storeCategory(contestId: string, category: Category): void;
  storeParticipant(contestId: string, participant: Participant): void;
  storeJudge(contestId: string, judge: Judge): void;
  onContestsChanged(listener: (contests: Array<Contest>) => void): void;
  onContestChanged(contestId: string, listener: (contest: Contest) => void): void;
  onParticipantsChanged(contestId: string, listener: (participants: Array<Participant>) => void): void;
  onParticipantChanged(contestId: string, participantId: string, listener: (participant: Participant) => void): void;
  onCategoriesChanged(contestId: string, listener: (categories: Array<Category>) => void): void;
  onJudgesChanged(contestId: string, listener: (judges: Array<Judge>) => void): void;
  onScoresChanged(contestId: string, listener: (score: Array<Score>) => void): void;
  getParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, listener: (score: Score) => void): void;
  setParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, score: {[key: string]: number}): void;
  setParticipantJudgedBy(contestId: string, participantId: string, judgeId: string, value: boolean): void;
  storeJudgeKey(contestId: string, judge: Judge, key: string): void;
  getJudgeKey(judgeId: string, callback: (key: string | null) => void): void;
}

export interface JudgesRepository {
  createJudge(contestId: string, id: string, password: string): void;
  authenticate(contestId: string, id: string, key: string): void;
  getAuthenticatedJudge(): {contestId: string, judgeId: string} | null;
  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void;
  signOut(): void;
}

export function generateId(): string {
  return crypto.randomUUID().slice(0, 13)
}