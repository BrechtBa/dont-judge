import { collection, deleteDoc, doc, documentId, Firestore, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { FirebaseStorage, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { Category, Contest, ContestRepository, generateId, Participant, Score, ScoreArea, User } from "../domain";
import { app } from "./firebaseConfig";


interface CategoryDto {
  name: string;
}

interface ParticipantDto {
  name: string;
  code: string;
  categoryId: string | undefined;
  judgedBy: {[key: string]: boolean};
}

interface ScoreAreaDto {
  name: string;
  comment: string;
  maximumScore: number;
}

interface RankingDto {
  name: string;
  scoreAreas: {[key: string]: boolean};
  perCategory: boolean;
}


interface ContestDto {
  name: string;
  description: string;
  logo: string;
  scoreAreas: {[id: string]: ScoreAreaDto};
  categories: {[id: string]: CategoryDto};
  rankings: {[id: string]: RankingDto};
}

interface ScoreDto {
  participantId: string;
  judgeId: string;
  score: {[key: string]: number};
}


export class FirebaseContestRepository implements ContestRepository {
  private db: Firestore;
  private storage: FirebaseStorage;

  private contestsCollectionName = "contests";
  private participantsCollectionName = "participants";

  constructor(db: Firestore, storage: FirebaseStorage) {
    this.db = db
    this.storage = storage;
  }

  storeContest(contest: Contest) {
    const docRef = doc(this.db, this.contestsCollectionName, contest.id);
    setDoc(docRef, this.contestToContestDto(contest))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }


  deleteContest(contestId: string) {
    deleteDoc(doc(this.db, this.contestsCollectionName, contestId));
  }

  storeParticipant(contestId: string, participant: Participant) {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, this.participantsCollectionName, participant.id);
    setDoc(docRef, this.participantToParticipantDto(participant))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }

  onContestChanged(contestId: string, listener: (contest: Contest) => void) {
    onSnapshot(doc(this.db, this.contestsCollectionName, contestId), (snapshot) => {
      if( !snapshot.exists() ){
        return;
      }
      const data = snapshot.data();
      const contest = this.contestDtoToContest(snapshot.id, data as ContestDto);
      listener(contest);
    });
  }

  onParticipantsChanged(contestId: string, listener: (participants: Array<Participant>) => void): void {

    this.onContestChanged(contestId, (contest) => {
      onSnapshot(collection(this.db, this.contestsCollectionName, contestId, this.participantsCollectionName), (snapshot) => {
        const values: Array<Participant> = [];

        snapshot.forEach((doc) => {
          const participant = this.participantDtoToParticipant(doc.id, doc.data() as ParticipantDto, contest)
          values.push(participant);
        });
        listener(values)
      });
    });
  }

  onParticipantChanged(contestId: string, participantId: string, listener: (participant: Participant) => void): void {

    this.onContestChanged(contestId, (contest) => {
      onSnapshot(doc(this.db, this.contestsCollectionName, contestId, this.participantsCollectionName, participantId), (doc) => {
        const participant = this.participantDtoToParticipant(doc.id, doc.data() as ParticipantDto, contest)
        listener(participant)
      });
    });
  }

  onScoresChanged(contestId: string, listener: (scores: Array<Score>) => void): void {
    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "scores"), (snapshot) => {
      let scores: Array<Score> = [];

      snapshot.forEach((doc) => {
        scores.push(this.scoreDtoToScore(doc.id, doc.data() as ScoreDto));
      });
      listener(scores);
    });
  }

  getParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, listener: (score: Score) => void): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId), where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      snapshot.forEach((doc) => {
        listener(this.scoreDtoToScore(doc.id, doc.data() as ScoreDto))
      });
    });
  }

  storeParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, score: {[key: string]: number}): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId), where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      
      if(snapshot.empty){
        setDoc(doc(this.db, this.contestsCollectionName, contestId, "scores", generateId()), {
          participantId: participantId,
          judgeId: judgeId,
          score: score,
        });
        return
      }

      snapshot.forEach((scoreDoc) => {
        setDoc(doc(this.db, this.contestsCollectionName, contestId, "scores", scoreDoc.id), {
          participantId: participantId,
          judgeId: judgeId,
          score: score,
        });
      });

    });
  };
  
  deleteParticipantJudgeScore(contestId: string, participantId: string, judgeId: string): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId), where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      const batch = writeBatch(this.db);
      snapshot.forEach((scoreDoc) => {
        batch.delete(scoreDoc.ref);
      });
      
      batch.commit();
    });
  }

  storeParticipantJudgedBy(contestId: string, participantId: string, judgeId: string, value: boolean): void {
    const key = `judgedBy.${judgeId}`;
    const update = {
      [key]: value
    };
    updateDoc(doc(this.db, this.contestsCollectionName, contestId, this.participantsCollectionName, participantId), update);
  }

  addAdminToContest(contestId: string, user: User): void {
    setDoc(doc(this.db, this.contestsCollectionName, contestId, "users", user.id), {admin: true});
  }

  async getContestAdmins(contestId: string): Promise<Array<string>> {
    return getDocs(collection(this.db, this.contestsCollectionName, contestId, "users")).then((snapshot) => {
      let userIds: Array<string> = [];
      snapshot.forEach((doc) => {
        userIds.push(doc.id);
      });
      return userIds;
    });
  }

  onAdminsChanged(contestId: string, callback: (userIds: Array<string>) => void): void {
    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "users"), (snapshot) => {
      let users: Array<string> = [];

      snapshot.forEach((doc) => {
        users.push(doc.id);
      });
      callback(users);
    });
  }


  deleteParticipant(contestId: string, participantId: string): void {
    deleteDoc(doc(this.db, this.contestsCollectionName, contestId, this.participantsCollectionName, participantId))
  }

  deleteAllParticipantScores(contestId: string, participantId: string): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId));

    getDocs(q).then((snapshot) => {
      const batch = writeBatch(this.db);
      snapshot.forEach((scoreDoc) => {
        batch.delete(scoreDoc.ref);
      });
      
      batch.commit();
    });
  }
  
  deleteAllJudgeScores(contestId: string, judgeId: string): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      const batch = writeBatch(this.db);
      snapshot.forEach((scoreDoc) => {
        batch.delete(scoreDoc.ref);
      });
      
      batch.commit();
    });
  }

  deleteCategoryFromAllScoreEntries(contestId: string, categoryId: string): void {
    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "scores"), (snapshot) => {
      const batch = writeBatch(this.db);

      snapshot.forEach((scoreDoc) => {
        batch.update(scoreDoc.ref, {[`score.${categoryId}`]: null});
      });
      
      batch.commit();
    });
  }

  async getContestsByIds(contestIds: Array<string>): Promise<Array<Contest>> {
    const q = query(collection(this.db, this.contestsCollectionName), where(documentId(), "in", contestIds));
    
    return getDocs(q).then((docSnaps) => {
      let contests: Array<Contest> = [];

      docSnaps.forEach((docSnap) => {
        const data = docSnap.data();
        const contest = this.contestDtoToContest(docSnap.id, data as ContestDto);
        contests.push(contest);
      });

      return contests;
    });
  }

  async uploadContestLogo(contestId: string, file: File): Promise<void> {
    const storageRef = ref(this.storage, contestId);

    return uploadBytes(storageRef, file).then(() => {
      getDownloadURL(storageRef).then(url =>{
        console.log(url);
        updateDoc(doc(this.db, this.contestsCollectionName, contestId), {logo: url});
      });
    });
  }

  private contestDtoToContest(id: string, data: ContestDto): Contest {
    return {
      id: id,
      name: data.name,
      description: data.description,
      logo: data.logo === "" ? null : data.logo,
      scoreAreas: Object.entries(data.scoreAreas).reduce((accumulator, [key, val]) => ({...accumulator, [key]: this.scoreAreaDtoToScoreArea(key, val)}), {}),
      categories: Object.entries(data.categories).reduce((accumulator, [key, val]) => ({...accumulator, [key]: this.categoryDtoToCategory(key, val)}), {}),
      rankings: Object.entries(data.rankings).reduce((accumulator, [key, val]) => ({...accumulator, [key]: {id: key, ...val}}), {}),
    }
  }
  private scoreAreaDtoToScoreArea(id: string, data: ScoreAreaDto): ScoreArea {
    return {
      id: id,
      name: data.name,
      comment: data.comment,
      maximumScore: data.maximumScore,
    }
  }
  private categoryDtoToCategory(id: string, data: CategoryDto): Category {
    return {
      id: id,
      name: data.name
    }
  }

  private participantDtoToParticipant(id: string, data: ParticipantDto, contest: Contest): Participant {
    let judgeIds: Array<string> = [];
    Object.entries(data.judgedBy).forEach(([key, val]) => {
      if( val ) {
        judgeIds.push(key);
      }
    });

    return {
      id: id,
      code: data.code,
      name: data.name,
      category: contest.categories[data.categoryId || ""],
      judgedBy: judgeIds,
    }
  }

  private contestToContestDto(contest: Contest): ContestDto {
    return {
      name: contest.name,
      description: contest.description,
      logo: contest.logo === null ? "" : contest.logo,
      scoreAreas: Object.entries(contest.scoreAreas).reduce((accumulator, [key, val]) => ({[key]: this.scoreAreaToScoreAreaDto(val), ...accumulator}), {}),
      categories: Object.entries(contest.categories).reduce((accumulator, [key, val]) => ({[key]: this.categoryToCategoryDto(val), ...accumulator}), {}),
      rankings: contest.rankings,
    }
  }
  private scoreAreaToScoreAreaDto(scoreArea: ScoreArea): ScoreAreaDto {
    return {
      name: scoreArea.name,
      comment: scoreArea.comment,
      maximumScore: scoreArea.maximumScore,
    }
  }
  private categoryToCategoryDto(category: Category): CategoryDto {
    return {
      name: category.name,
    }
  }

  private participantToParticipantDto(participant: Participant): ParticipantDto {
    return {
      name: participant.name,
      code: participant.code,
      categoryId: participant.category?.id,
      judgedBy: participant.judgedBy.reduce((acc, val) => ({...acc, [val]: true}), {}),
    }
  }

  private scoreDtoToScore(id: string, data: ScoreDto): Score {
    return {
      id: id,
      participantId: data.participantId,
      judgeId: data.judgeId,
      score: data.score
    }
  }

  // private scoreToScoreDto(score: Score): ScoreDto {
  //   return {
  //     participantId: score.participantId,
  //     judgeId: score.judgeId,
  //     score: score.score
  //   }
  // }
}

export const firebaseContestRepository = new FirebaseContestRepository(getFirestore(app), getStorage(app));
