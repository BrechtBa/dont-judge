import { collection, doc, Firestore, getDoc, getDocs, getFirestore, onSnapshot, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { FirebaseApp } from "firebase/app";
import { Category, Contest, ContestRepository, Judge, Participant, Score, ScoreCategory } from "../domain";
import { app } from "./firebaseConfig";


interface CategoryDto {
  name: string;
}

interface ParticipantDto {
  name: string;
  categoryId: string | undefined;
  judgedBy: {[key: string]: boolean};
}

interface JudgeDto {
  name: string;
}

interface ScoreCategoryDto {
  name: string;
  maximumScore: number;
}

interface ContestDto {
  name: string;
  scoreCategories: {[id: string]: ScoreCategoryDto};
}

interface ScoreDto {
  participantId: string;
  judgeId: string;
  score: {[key: string]: number};
}


class FirebaseContestRepository implements ContestRepository {
  private db: Firestore;

  private contestsCollectionName = "contests";
  private judgeKeysCollectionName = "judgeKeys";

  constructor(app: FirebaseApp) {
    this.db = getFirestore(app);
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

  storeCategory(contestId: string, category: Category) {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, "categories", category.id);
    setDoc(docRef, this.categoryToCategoryDto(category))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }

  storeParticipant(contestId: string, participant: Participant) {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, "participants", participant.id);
    setDoc(docRef, this.participantToParticipantDto(participant))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }

  storeJudge(contestId: string, judge: Judge, key: string) {
    const docRef = doc(this.db, this.judgeKeysCollectionName, judge.id);
    setDoc(docRef, {key: key, contestId: contestId})
    .then(() => {

      const docRef = doc(this.db, this.contestsCollectionName, contestId, "judges", judge.id);
      setDoc(docRef, this.judgeToJudgeDto(judge))
      .then(() => {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch((error) => {
        console.error("Error storing document: ", error);
      });
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
  }

  async getJudgeKey(id: string): Promise<string | null> {
    const docRef = doc(this.db, this.judgeKeysCollectionName, id);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return new Promise((resolve) => resolve(null));
    }

    const key = docSnap.data().key || null;
    return new Promise((resolve) => resolve(key));
  }

  onContestsChanged(listener: (contests: Array<Contest>) => void) {
    onSnapshot(collection(this.db, this.contestsCollectionName), (snapshot) => {
      const values: Array<Contest> = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        values.push(this.contestDtoToContest(doc.id, data as ContestDto));
      });
      listener(values);
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

    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "categories"), (snapshot) => {
      let categoriesMap = new Map();

      snapshot.forEach((doc) => {
        categoriesMap.set(doc.id, this.categoryDtoToCategory(doc.id, doc.data() as CategoryDto));
      });

      onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "participants"), (snapshot) => {
        const values: Array<Participant> = [];

        snapshot.forEach((doc) => {
          const participant = this.participantDtoToParticipant(doc.id, doc.data() as ParticipantDto, categoriesMap)
          values.push(participant);
        });
        listener(values)
      });
    });
  }

  onParticipantChanged(contestId: string, participantId: string, listener: (participant: Participant) => void): void {
    onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "categories"), (snapshot) => {
      let categoriesMap = new Map();

      snapshot.forEach((doc) => {
        categoriesMap.set(doc.id, this.categoryDtoToCategory(doc.id, doc.data() as CategoryDto));
      });

      onSnapshot(doc(this.db, this.contestsCollectionName, contestId, "participants", participantId), (doc) => {
        const participant = this.participantDtoToParticipant(doc.id, doc.data() as ParticipantDto, categoriesMap)
        listener(participant)
      });
    });
  }

  getParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, listener: (score: Score) => void): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId), where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      snapshot.forEach((doc) => {
        listener(this.scoreDtoToScore(doc.data() as ScoreDto))
      });
    });
  }
  setParticipantJudgeScore(contestId: string, participantId: string, judgeId: string, score: {[key: string]: number}): void {
    const q = query(collection(this.db, this.contestsCollectionName, contestId, "scores"), 
                    where("participantId", "==", participantId), where("judgeId", "==", judgeId));

    getDocs(q).then((snapshot) => {
      snapshot.forEach((scoreDoc) => {
        console.log(scoreDoc.id)
        setDoc(doc(this.db, this.contestsCollectionName, contestId, "scores", scoreDoc.id), {
          participantId: participantId,
          judgeId: judgeId,
          score: score,
        });

      });
    });
  };

  setParticipantJudgedBy(contestId: string, participantId: string, judgeId: string, value: boolean): void {
    const key = `judgedBy.${judgeId}`;
    const update = {
      [key]: value
    };
    updateDoc(doc(this.db, this.contestsCollectionName, contestId, "participants", participantId), update);
  }

  private contestDtoToContest(id: string, data: ContestDto): Contest {
    return {
      id: id,
      name: data.name,
      scoreCategories: Object.entries(data.scoreCategories).reduce((accumulator, [key, val]) => ({[key]: this.scoreCategoryDtoToScoreCategory(key, val), ...accumulator}), {}),
    }
  }
  private scoreCategoryDtoToScoreCategory(id: string, data: ScoreCategoryDto): ScoreCategory {
    return {
      id: id,
      name: data.name,
      maximumScore: data.maximumScore,
    }
  }
  private categoryDtoToCategory(id: string, data: CategoryDto): Category {
    return {
      id: id,
      name: data.name
    }
  }

  private participantDtoToParticipant(id: string, data: ParticipantDto, categoriesMap: Map<string, Category>): Participant {
    return {
      id: id,
      name: data.name,
      category: categoriesMap.get(data.categoryId || ""),
    }
  }

  private judgeDtoToJudge(id: string, data: JudgeDto): Judge {
    return {
      id: id,
      name: data.name
    }
  }  
  private contestToContestDto(contest: Contest): ContestDto {
    return {
      name: contest.name,
      scoreCategories: Object.entries(contest.scoreCategories).reduce((accumulator, [key, val]) => ({[key]: this.scoreCategoryToScoreCategoryDto(val), ...accumulator}), {}),
    }
  }
  private scoreCategoryToScoreCategoryDto(scoreCategory: ScoreCategory): ScoreCategoryDto {
    return {
      name: scoreCategory.name,
      maximumScore: scoreCategory.maximumScore,
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
      categoryId: participant.category?.id,
    }
  }
  private judgeToJudgeDto(judge: Judge): JudgeDto {
    return {
      name: judge.name
    }
  }
  private scoreDtoToScore(data: ScoreDto): Score {
    return {
      participantId: data.participantId,
      judgeId: data.judgeId,
      score: data.score
    }
  }
  private scoreToScoreDto(score: Score): ScoreDto {
    return {
      participantId: score.participantId,
      judgeId: score.judgeId,
      score: score.score
    }
  }

}

export const firebaseContestRepository = new FirebaseContestRepository(app);
