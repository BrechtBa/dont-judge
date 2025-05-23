import { doc, Firestore, getDoc, setDoc, getFirestore, updateDoc, query, collection, onSnapshot, where, documentId, deleteField, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, Auth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";

import { User, UsersRepository } from "../domain";
import { FirebaseApp } from "firebase/app";
import { app } from "./firebaseConfig";


interface UserDto {
  admin: boolean;
  activeContestId: string;
  availableContests: {[contestId: string]: boolean};
  displayName: string;
  email: string;
}


class FirebaseUsersRepository implements UsersRepository {
  private db: Firestore;
  private auth: Auth;

  private usersCollectionName = "users";
  private activeContestId: string = "";

  private authenticatedUserEmail: string = "";
  private authenticatedUser: User | null = null;

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
    this.auth = getAuth(app);
  }

  getActiveContestId(): string {
    return this.activeContestId;
  }

  async setActiveContest(contestId: string): Promise<void>{
    if (this.authenticatedUser === null){
      return new Promise(resolve => resolve());
    }
    this.activeContestId = contestId;
    return updateDoc(doc(this.db, this.usersCollectionName, this.authenticatedUser.id), {"activeContestId": contestId});
  }

  getAuthenticatedUserEmail(): string {
    return this.authenticatedUserEmail;
  }

  getAuthenticatedUser(): User | null {
    return this.authenticatedUser;
  }

  getAuthenticatedUserAvailableContests(): Promise<Array<string>> {
    if (this.authenticatedUser === null){
      return new Promise(resolve => resolve([]));
    }
    return getDoc(doc(this.db, this.usersCollectionName, this.authenticatedUser.id)).then(docSnap => {
      if (!docSnap.exists()) {
        return [];
      }
      const user = docSnap.data() as UserDto;
      return Object.keys(user.availableContests);
    });
  }

  async registerUser(contestId: string, email: string, password: string): Promise<User> {
    return createUserWithEmailAndPassword(this.auth, email, password).then(async userCredential => {

      const userDto: UserDto = {
        displayName: email.split("@")[0].replace(".", " ").replace("_", " "),
        admin: true, 
        activeContestId: contestId, 
        availableContests: {[contestId]: true},
        email: email,
      }

      return setDoc(doc(this.db, this.usersCollectionName, userCredential.user.uid), userDto).then(async () =>{
        return this.userDtoToUser(userCredential.user.uid, userDto);
      });
    });
  }

  sendPasswordResetEmail(email: string): void {
    sendPasswordResetEmail(this.auth, email);
  }


  async getUserByEmail(email: string): Promise<User> {
    const q = query(collection(this.db, this.usersCollectionName), where("email", '==', email));
    return getDocs(q).then(querySnapshot => {
      if (querySnapshot.docs.length === 0) {
        throw "no such email";
      }
      const docSnap = querySnapshot.docs[0]
      const data = docSnap.data() as UserDto;
      return {
        id: docSnap.id,
        displayName: data.displayName
      };
    });
  }

  async authenticate(email: string, password: string): Promise<void> {
    return signInWithEmailAndPassword(this.auth, email, password).then(() =>{})
    .catch((e) => {
      console.log(e.code)
      if(e.code === "auth/invalid-email"){
        throw new  Error("Ongeldig email adres");
      }
      if(e.code === "auth/invalid-credential"){
        throw new  Error("Email of wachtwoord onjuist");
      }
      throw new  Error("Login error");  
   
    });
  }

  onAuthenticatedChanged(callback: (authenticated: boolean) => void): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // validate this is a known user
        getDoc(doc(this.db, this.usersCollectionName, user.uid)).then(docSnap => {
          if (!docSnap.exists()) {
            this.authenticatedUserEmail = "";
            this.authenticatedUser = null;
            callback(false);
            return
          }
          const data = docSnap.data();
          this.activeContestId = data.activeContestId;
          this.authenticatedUserEmail = user.email || "";
          this.authenticatedUser = this.userDtoToUser(user.uid, data as UserDto);
          callback(true);
        }).catch(_ => {
          this.authenticatedUserEmail = "";
          this.authenticatedUser = null;
          callback(false);
        }); 
      } else {
        this.authenticatedUserEmail = "";
        this.authenticatedUser = null;
        callback(false);
      }
    });
  }

  signOut(): void {
    signOut(this.auth);
  }

  addContestToUser(userId: string, contestId: string): void {
    updateDoc(doc(this.db, this.usersCollectionName, userId), {[`availableContests.${contestId}`]: true});
  }

  deleteContestFromUser(userId: string, contestId: string): void {
    updateDoc(doc(this.db, this.usersCollectionName, userId), {[`availableContests.${contestId}`]: deleteField()});
  }

  onUsersChanged(userIds: Array<string>, callback: (users: Array<User>) => void): void {

    const q = query(collection(this.db, this.usersCollectionName), where(documentId(), 'in', userIds));
    onSnapshot(q, (querySnapshot) => {

      let users: Array<User> = [];

      querySnapshot.forEach(doc => {
        if( userIds.indexOf(doc.id) > -1 ) {
          users.push(this.userDtoToUser(doc.id, doc.data() as UserDto))
        } 
      });
      callback(users);
    })
  }


  private userDtoToUser(id: string, data: UserDto): User {
    return {
      id: id,
      displayName: data.displayName,
    }
  }
}


export const firebaseUsersRepository = new FirebaseUsersRepository(app);


