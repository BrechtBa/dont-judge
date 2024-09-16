import { collection, doc, Firestore, getDocs, getFirestore, onSnapshot, query, setDoc, updateDoc, where } from "firebase/firestore";
import { FirebaseApp } from "firebase/app";
import { Category, Contest, ContestRepository, generateId, Judge, Participant, Score, ScoreArea } from "../domain";
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

interface ScoreAreaDto {
  name: string;
  maximumScore: number;
}

interface ContestDto {
  name: string;
  scoreAreas: {[id: string]: ScoreAreaDto};
  categories: {[id: string]: CategoryDto};
}

interface ScoreDto {
  participantId: string;
  judgeId: string;
  score: {[key: string]: number};
}


class FirebaseContestRepository implements ContestRepository {
  private db: Firestore;

  private contestsCollectionName = "contests";
  

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

  storeJudge(contestId: string, judge: Judge) {
    const docRef = doc(this.db, this.contestsCollectionName, contestId, "judges", judge.id);
    setDoc(docRef, this.judgeToJudgeDto(judge))
    .then(() => {
      console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
      console.error("Error storing document: ", error);
    });
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

    this.onContestChanged(contestId, (contest) => {
      onSnapshot(collection(this.db, this.contestsCollectionName, contestId, "participants"), (snapshot) => {
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
      onSnapshot(doc(this.db, this.contestsCollectionName, contestId, "participants", participantId), (doc) => {
        const participant = this.participantDtoToParticipant(doc.id, doc.data() as ParticipantDto, contest)
        listener(participant)
      });
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

  storeParticipantJudgedBy(contestId: string, participantId: string, judgeId: string, value: boolean): void {
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
      scoreAreas: Object.entries(data.scoreAreas).reduce((accumulator, [key, val]) => ({[key]: this.scoreAreaDtoToScoreArea(key, val), ...accumulator}), {}),
      categories: Object.entries(data.categories).reduce((accumulator, [key, val]) => ({[key]: this.categoryDtoToCategory(key, val), ...accumulator}), {}),
    }
  }
  private scoreAreaDtoToScoreArea(id: string, data: ScoreAreaDto): ScoreArea {
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

  private participantDtoToParticipant(id: string, data: ParticipantDto, contest: Contest): Participant {
    return {
      id: id,
      name: data.name,
      category: contest.categories[data.categoryId || ""],
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
      scoreAreas: Object.entries(contest.scoreAreas).reduce((accumulator, [key, val]) => ({[key]: this.scoreAreaToScoreAreaDto(val), ...accumulator}), {}),
      categories: Object.entries(contest.categories).reduce((accumulator, [key, val]) => ({[key]: this.categoryToCategoryDto(val), ...accumulator}), {}),
    }
  }
  private scoreAreaToScoreAreaDto(scoreArea: ScoreArea): ScoreAreaDto {
    return {
      name: scoreArea.name,
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
      categoryId: participant.category?.id,
      judgedBy: {}, // FIXME
    }
  }
  private judgeToJudgeDto(judge: Judge): JudgeDto {
    return {
      name: judge.name
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

export const firebaseContestRepository = new FirebaseContestRepository(app);
