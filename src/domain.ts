

export interface Category {
  id: string;
  name: string;
}


export interface Participant {
  id: string;
  name: string;
  category: Category | undefined;
}


export interface Judge {
  id: string;
  name: string;
}


export interface Contest {
  id: string;
  name: string;
  categories: Array<Category>;
  participants: Array<Participant>;
  judges: Array<Judge>;
}


export interface ScoreSection {
  id: string;
  name: string;
}


export interface Score {
  participantId: string;
  juryId: string;
  points: {[key: string]: number};
}


export interface ContestRepository {
  storeContest(contest: Contest): void;
  storeCategory(contestId: string, category: Category): void;
  storeParticipant(contestId: string, participant: Participant): void;
  storeJudge(contestId: string, judge: Judge, key: string): void;
  onContestsChanged(listener: (contests: Array<Contest>) => void): void;
  onParticipantsChanged(contestId: string, listener: (participants: Array<Participant>) => void): void;
  onParticipantChanged(contestId: string, participantId: string, listener: (participant: Participant) => void): void;
  getJudgeKey(id: string): Promise<string | null>;
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