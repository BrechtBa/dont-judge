import { doc, Firestore, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import { UsersRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app } from "./firebaseConfig";


class FirebaseUsersRepository implements UsersRepository {
  private db: Firestore;
  private auth: Auth;

  private usersCollectionName = "users";
  private activeContestId: string = "";

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }

  getActiveContestId(): string {
    return this.activeContestId;
  }

  registerUser(contestId: string, email: string, password: string, callback: (uid: string) => void): void {
    createUserWithEmailAndPassword(this.auth, email, password).then((userCredential) => {
      setDoc(doc(this.db, this.usersCollectionName, userCredential.user.uid), {admin: true, activeContestId: contestId}).then(() =>{
        callback(userCredential.user.uid);
      });
    });
  }

  authenticate(email: string, password: string): void {
    signInWithEmailAndPassword(this.auth, email, password);
  }

  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // validate this is a known user
        getDoc(doc(this.db, this.usersCollectionName, user.uid)).then(docSnap => {
          if (!docSnap.exists()) {
            callback(false);
            return
          }
          this.activeContestId = docSnap.data().activeContestId;
          callback(true);
        }).catch(_ => {
          callback(false);
        }); 
      } else {
        callback(false);
      }
    });
  }

  signOut(): void {
    signOut(this.auth);
  }

}


export const firebaseUsersRepository = new FirebaseUsersRepository(app);


