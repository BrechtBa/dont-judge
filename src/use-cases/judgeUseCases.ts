import { ContestRepository, JudgesRepository, Judge, Contest, Participant, Score } from "../domain";


export class JudgeUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
  }

  authenticate(contestId: string, judgeId: string, key: string): void {
    this.judgesRepository.authenticate(contestId, judgeId, key);
  }

  authenticateWithQrData(data: string): void {
    let values = data;

    if (data.includes("?key=")) {
      values = data.split("?key=")[1];
    }

    const [judgeId, contestId, key] = values.split("@");
    this.authenticate(contestId, judgeId, key);
  }

  signOut(): void {
    this.judgesRepository.signOut();
  }

  getAuthenticatedJudge(): Judge | null {
    const val = this.judgesRepository.getAuthenticatedJudge();
    if (val === null) {
      return null;
    }
    return val.judge;
  }

  useIsAuthenticated(callback: (authenticated: boolean) => void) {
    this.judgesRepository.onAuthenticatedChanged(callback);
  }

  useActiveContest(callback: (contest: Contest) => void) {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    this.contestRepository.onContestChanged(judge.contestId, callback);
  }

  private stringToInt(val: string): number {
    let utf8Encode = new TextEncoder();
    return utf8Encode.encode(val).reduce((acc, val, ind) => acc + val*Math.pow(2, ind), 0)
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }

    const sortFunction = (a: Participant, b: Participant) => {
      if (a.judgedBy.indexOf(judge.judge.id) === -1 && b.judgedBy.indexOf(judge.judge.id) > -1) {
        return -1;
      }
      if (a.judgedBy.indexOf(judge.judge.id) > -1 && b.judgedBy.indexOf(judge.judge.id) === -1) {
        return 1;
      }
      if(a.judgedBy.length === b.judgedBy.length){
        const judgeNumber = this.stringToInt(judge.judge.id)

        return (this.stringToInt(a.id) % judgeNumber) - (this.stringToInt(b.id) % judgeNumber);

      }
      return a.judgedBy.length - b.judgedBy.length;
    };

    this.contestRepository.onParticipantsChanged(judge.contestId, (participants) => {
      callback(participants.sort(sortFunction));
    });
  }

  useParticipant(participantId: string, callback: (particpants: Participant) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    this.contestRepository.onParticipantChanged(judge.contestId, participantId, callback);
  }

  getScore(participantId: string, callback: (score: Score) => void): void {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    this.contestRepository.getParticipantJudgeScore(judge.contestId, participantId, judge.judge.id, callback);
  }

  setScore(participantId: string, score: { [key: string]: number; }) {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    this.contestRepository.storeParticipantJudgeScore(judge.contestId, participantId, judge.judge.id, score);
    this.contestRepository.storeParticipantJudgedBy(judge.contestId, participantId, judge.judge.id, true);
  }
  deleteScore(participantId: string) {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    this.contestRepository.deleteParticipantJudgeScore(judge.contestId, participantId, judge.judge.id);
    this.contestRepository.storeParticipantJudgedBy(judge.contestId, participantId, judge.judge.id, false);
  }

  updateProfile(newJudge: Judge) {
    const judge = this.judgesRepository.getAuthenticatedJudge();
    if (judge === null) {
      return;
    }
    if (judge.judge.id !== newJudge.id) {
      return;
    }
    this.judgesRepository.storeJudge(judge.contestId, newJudge);
    this.judgesRepository.setAuthenticatedJudge(newJudge);
  }
}
