import { collection, deleteDoc, doc, Firestore, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";

import { Judge, JudgesRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app, secondaryApp } from "./firebaseConfig";


interface JudgeDto {
  name: string;
}


class FirebaseJudgesRepository implements JudgesRepository {
  private db: Firestore;
  private auth: Auth;
  private secondaryAuth: Auth;

  private authenticatedContestId: string | null;
  private authenticatedJudge: Judge | null;
  
  private contestsCollectionName = "contests";
  private judgesCollectionName = "judges";
  private judgeKeysCollectionName = "judgeKeys";

  constructor(app: FirebaseApp, secondaryApp: FirebaseApp) {
    this.db = getFirestore(app);
    this.auth = getAuth(app);
    this.secondaryAuth = getAuth(secondaryApp);
    this.authenticatedContestId = null;
    this.authenticatedJudge = null;
  }

  createJudge(contestId: string, judgeId: string, key: string): void {
    createUserWithEmailAndPassword(this.secondaryAuth, this.makeJudgeEmail(contestId, judgeId), key).then((userCredential) => {
      setDoc(doc(this.db, this.contestsCollectionName, contestId, this.judgeKeysCollectionName, judgeId), {key: key, uid: userCredential.user.uid})
    });
  }

  authenticate(contestId: string, judgeId: string, key: string): void {
    signInWithEmailAndPassword(this.auth, this.makeJudgeEmail(contestId, judgeId), key);
  }

  getAuthenticatedJudge(): {contestId: string, judge: Judge} | null {
    if(this.authenticatedContestId === null || this.authenticatedJudge === null){
      return null;
    }
    return {contestId: this.authenticatedContestId, judge: this.authenticatedJudge}
  }
  setAuthenticatedJudge(judge: Judge): void {
    this.authenticatedJudge = judge;
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
        this.getJudge(contestId, judgeId).then(judge => {
          if (judge === null ){
            this.authenticatedJudge = null;
            this.authenticatedContestId = null;
            callback(false);
            return
          }
          this.authenticatedJudge = judge;
          this.authenticatedContestId = contestId;
          callback(true);
        });

        // validate this is a judge
        // this.getJudgeKey(contestId, judgeId, (key: string | null) => {
        //   if( key === null){
        //     this.authenticatedContestId = null;
        //     callback(false);
        //     return
        //   }
        //   this.authenticatedJudgeId = judgeId;
        //   this.authenticatedContestId = host.split(".")[0];
        //   callback(true);
        // });
      } 
      else {
        this.authenticatedJudge = null;
        this.authenticatedContestId = null;
        callback(false);
      }
    });
  }

  signOut(): void {
    signOut(this.auth);
  }

  storeJudge(contestId: string, judge: Judge) {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, this.judgesCollectionName, judge.id);
    setDoc(docRef, this.judgeToJudgeDto(judge))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }

  onJudgesChanged(contestId: string, listener: (judges: Array<Judge>) => void): void {
    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "judges"), (snapshot) => {
      let judges: Array<Judge> = [];

      snapshot.forEach((doc) => {
        judges.push(this.judgeDtoToJudge(doc.id, doc.data() as JudgeDto));
      });
      listener(judges);
    });
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
      return
    }).catch( _ => {
      callback(null)
      return
    }); 
  }
  
  async getJudge(contestId: string, judgeId: string): Promise<Judge | null> {
    return new Promise(resolve => {
      getDoc(doc(this.db, this.contestsCollectionName, contestId, this.judgesCollectionName, judgeId)).then(docSnap => {
        if (!docSnap.exists()) {
          resolve(null);
          return
        }
        resolve(this.judgeDtoToJudge(docSnap.id, docSnap.data() as JudgeDto));
        return
      }).catch(e => {
        console.log(e)
        resolve(null)
        return
      });  
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

  private judgeDtoToJudge(id: string, data: JudgeDto): Judge {
    return {
      id: id,
      name: data.name
    }
  }

  private judgeToJudgeDto(judge: Judge): JudgeDto {
    return {
      name: judge.name
    }
  }

}


export const firebaseJudgesRepository = new FirebaseJudgesRepository(app, secondaryApp);


