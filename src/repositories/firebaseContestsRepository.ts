import { collection, doc, Firestore, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";
import { FirebaseApp } from "firebase/app";
import { Category, Contest, ContestRepository, Judge, Participant } from "../domain";
import { app } from "./firebaseConfig";


interface CategoryDto {
  name: string;
}

interface ParticipantDto {
  name: string;
  categoryId: string | undefined;
}

interface JudgeDto {
  name: string;
}

interface ContestDto {
  name: string;
  categories: {[id: string]: CategoryDto};
  participants: {[id: string]: ParticipantDto};
  judges: {[id: string]: JudgeDto};
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

  private contestDtoToContest(id: string, data: ContestDto): Contest {
    // console.log(Object.entries(data.categories).map(([key, val]) => ([key, this.categoryDtoToCategory(key, val)])))

    const categoriesMap = new Map(Object.entries(data.categories || {}).map(([key, val]) => ([key, this.categoryDtoToCategory(key, val)])));

    return {
      id: id,
      name: data.name,
      categories: Array.from(categoriesMap, ([_, value]) => value),
      participants: Object.entries(data.participants || {}).map(([key, val]) => this.participantDtoToParticipant(key, val, categoriesMap)),
      judges: Object.entries(data.judges || {}).map(([key, val]) => this.judgeDtoToJudge(key, val)),
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
      categories: contest.categories.reduce((accumulator, val) => ({[val.id]: this.categoryToCategoryDto(val), ...accumulator}), {}),
      participants: contest.participants.reduce((accumulator, val) => ({[val.id]: this.participantToParticipantDto(val), ...accumulator}), {}),
      judges: contest.judges.reduce((accumulator, val) => ({[val.id]: this.judgeToJudgeDto(val), ...accumulator}), {}),
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
}

export const firebaseContestRepository = new FirebaseContestRepository(app);
