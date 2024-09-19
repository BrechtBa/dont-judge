import { doc, Firestore, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

import { UsersRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app } from "./firebaseConfig";


class FirebaseUsersRepository implements UsersRepository {
  private db: Firestore;
  private auth: Auth;

  private usersCollectionName = "users";

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }

  registerUser(email: string, password: string, callback: (uid: string) => void): void {
    createUserWithEmailAndPassword(this.auth, email, password).then((userCredential) => {
      setDoc(doc(this.db, this.usersCollectionName, userCredential.user.uid), {admin: true}).then(() =>{
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
          callback(true);
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


