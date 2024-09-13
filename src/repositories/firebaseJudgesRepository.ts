import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import { JudgesRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app } from "./firebaseConfig";


class FirebaseJudgesRepository implements JudgesRepository {
  private auth: Auth;
  private authenticatedContestId: string | null;
  private authenticatedJudgeId: string | null;

  constructor(app: FirebaseApp) {
    this.auth = getAuth(app);
    this.authenticatedContestId = null;
    this.authenticatedJudgeId = null;
  }

  createJudge(contestId: string, id: string, key: string): void {
    createUserWithEmailAndPassword(this.auth, this.makeJudgeEmail(contestId, id), key);
  }

  authenticate(contestId: string, id: string, key: string): void {
    signInWithEmailAndPassword(this.auth, this.makeJudgeEmail(contestId, id), key);
    this.authenticatedContestId = contestId;
    this.authenticatedJudgeId = id;
  }

  getAuthenticatedJudge(): {contestId: string, judgeId: string} | null {
    if(this.authenticatedContestId === null || this.authenticatedJudgeId === null){
      return null;
    }
    return {contestId: this.authenticatedContestId, judgeId: this.authenticatedJudgeId}
  }

  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        if(user.email === null){
          callback(false);
          return
        }
        
        const [judgeId, host] = user.email.split("@");
        this.authenticatedJudgeId = judgeId;
        this.authenticatedContestId = host.split(".")[0];

        callback(true);
      } else {
        callback(false);
      }
    });
  }

  signOut(): void {
    signOut(this.auth);
  }

  private makeJudgeEmail(contestId: string, id: string): string {
    return  `${id}@${contestId}.com`
  }
}


export const firebaseJudgesRepository = new FirebaseJudgesRepository(app);


