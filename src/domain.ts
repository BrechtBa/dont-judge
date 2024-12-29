
export interface Category {
  id: string;
  name: string;
}


export interface Participant {
  id: string;
  code: string;
  name: string;
  category: Category | undefined;
  judgedBy: Array<string>;
}


export interface ScoreArea {
  id: string;
  name: string;
  comment: string;
  maximumScore: number;
}


export interface Judge {
  id: string;
  name: string;
}


export interface Ranking {
  id: string;
  name: string;
  scoreAreas: {[key: string]: boolean};
  perCategory: boolean;
}


export interface Contest {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  categories: {[key: string]: Category};
  scoreAreas: {[key: string]: ScoreArea};
  rankings: {[key: string]: Ranking};
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
      category: ScoreArea,
      score: number
    }
  };
}

export interface ParticipantScoreData {
  participant: Participant,
  totalScore: {
    total: number,
    scoreAreas: {
      [scoreAreaId: string]: number,
    }
  }
  judgeScores: {
    [key:  string]: {
      judge: Judge,
      total: number,
      scoreAreas: {
        [scoreAreaId: string]: number,
      }
    }
  }
}

export interface RankingData {
  ranking: Ranking,
  participantScoreData: Array<ParticipantScoreData>;
}


export interface ScoreDataPerParticipant {
  participant: Participant;
  rankingData: Array<{ranking: Ranking, score: ParticipantScoreData}>;
};


export interface User {
  id: string;
  displayName: string;
}

export interface ContestRepository {
  storeContest(contest: Contest): void;
  deleteContest(contestId: string): void;
  storeParticipant(contestId: string, participant: Participant): void;
  onContestChanged(contestId: string, listener: (contest: Contest) => void): void;
  onParticipantsChanged(contestId: string, listener: (participants: Array<Participant>) => void): void;
  onParticipantChanged(contestId: string, participantId: string, listener: (participant: Participant) => void): void;
  onScoresChanged(contestId: string, listener: (score: Array<Score>) => void): void;
  getParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, listener: (score: Score) => void): void;
  storeParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, score: {[key: string]: number}): void;
  storeParticipantJudgedBy(contestId: string, participantId: string, judgeId: string, value: boolean): void;
  addAdminToContest(contestId: string, user: User): void;
  getContestAdmins(contestId: string): Promise<Array<string>>;
  onAdminsChanged(contestId: string, callback: (userIds: Array<string>) => void): void;
  deleteParticipant(contestId: string, participantId: string): void;
  deleteAllParticipantScores(contestId: string, participantId: string): void;
  deleteAllJudgeScores(contestId: string, judgeId: string): void;
  deleteParticipantJudgeScore(contestId: string, participantId: string, judgeId: string): void;
  deleteCategoryFromAllScoreEntries(contestId: string, categoryId: string): void;
  getContestsByIds(contestIds: Array<string>): Promise<Array<Contest>>;
  uploadContestLogo(contestId: string, file: File): Promise<void>;
}


export interface JudgesRepository {
  createJudge(contestId: string, id: string, password: string): void;
  authenticate(contestId: string, id: string, key: string): void;
  getAuthenticatedJudge(): {contestId: string, judge: Judge} | null;
  setAuthenticatedJudge(judge: Judge): void;
  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void;
  signOut(): void;
  storeJudge(contestId: string, judge: Judge): void;
  onJudgesChanged(contestId: string, listener: (judges: Array<Judge>) => void): void;
  getJudge(contestId: string, judgeId: string): Promise<Judge | null>;
  getJudgeKey(contestId: string, judgeId: string, callback: (key: string | null) => void): void;
  deleteJudge(contestId: string, judgeId: string): void;
  deleteJudgeKey(contestId: string, judgeId: string): void;
}


export interface UsersRepository{
  authenticate(email: string, password: string): Promise<void>;
  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void;
  signOut(): void;
  registerUser(contestId: string, email: string, password: string): Promise<User>;
  addContestToUser(userId: string, contestId: string): void;
  deleteContestFromUser(userId: string, contestId: string): void;
  getActiveContestId(): string;
  setActiveContest(contestId: string): Promise<void>;
  getAuthenticatedUserEmail(): string;
  getAuthenticatedUser(): User | null;
  getAuthenticatedUserAvailableContests(): Promise<Array<string>>;
  onUsersChanged(userIds: Array<string>, callback: (users: Array<User>) => void): void;
  sendPasswordResetEmail(email: string): void;
  getUserByEmail(email: string): Promise<User>;
}

export function generateId(): string {
  return crypto.randomUUID().slice(0, 13)
}