import { deleteDoc, doc, Firestore, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";

import { JudgesRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app, secondaryApp } from "./firebaseConfig";


class FirebaseJudgesRepository implements JudgesRepository {
  private db: Firestore;
  private auth: Auth;
  private secondaryAuth: Auth;

  private authenticatedContestId: string | null;
  private authenticatedJudgeId: string | null;
  private contestsCollectionName = "contests";
  private judgeKeysCollectionName = "judgeKeys";

  constructor(app: FirebaseApp, secondaryApp: FirebaseApp) {
    this.db = getFirestore(app);
    this.auth = getAuth(app);
    this.secondaryAuth = getAuth(secondaryApp);
    this.authenticatedContestId = null;
    this.authenticatedJudgeId = null;
  }

  createJudge(contestId: string, judgeId: string, key: string): void {
    createUserWithEmailAndPassword(this.secondaryAuth, this.makeJudgeEmail(contestId, judgeId), key).then((userCredential) => {
      setDoc(doc(this.db, this.contestsCollectionName, contestId, this.judgeKeysCollectionName, judgeId), {key: key, uid: userCredential.user.uid})
    });
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
        const contestId = host.split(".")[0];

        // validate this is a judge
        this.getJudgeKey(contestId, judgeId, (key: string | null) => {
          if( key === null){
            this.authenticatedJudgeId = null;
            this.authenticatedContestId = null;
            callback(false);
            return
          }
          this.authenticatedJudgeId = judgeId;
          this.authenticatedContestId = host.split(".")[0];
          callback(true);
        });
      } else {
        this.authenticatedJudgeId = null;
        this.authenticatedContestId = null;
        callback(false);
      }
    });
  }

  signOut(): void {
    signOut(this.auth);
  }

  getJudgeKey(contestId: string, judgeId: string, callback: (key: string | null) => void): void {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, this.judgeKeysCollectionName, judgeId);

    getDoc(docRef).then(docSnap => {
      if (!docSnap.exists()) {
        callback(null);
        return
      }
      const key = docSnap.data().key;
      callback(key);
    }); 
  }


  deleteJudge(contestId: string, judgeId: string): void {
    deleteDoc(doc(this.db, this.contestsCollectionName, contestId, "judges", judgeId));
  }

  deleteJudgeKey(contestId: string, judgeId: string): void {
    this.getJudgeKey(contestId, judgeId, (key) => {
      if(key === null){
        return
      }
      signInWithEmailAndPassword(this.secondaryAuth, this.makeJudgeEmail(contestId, judgeId), key).then(() => {
        if(this.secondaryAuth.currentUser === null) {
          return;
        }
        deleteUser(this.secondaryAuth.currentUser);
        deleteDoc(doc(this.db, this.contestsCollectionName, contestId, "judgeKeys", judgeId));
      });
    });
    
  }

  private makeJudgeEmail(contestId: string, id: string): string {
    return  `${id}@${contestId}.com`
  }

}


export const firebaseJudgesRepository = new FirebaseJudgesRepository(app, secondaryApp);


