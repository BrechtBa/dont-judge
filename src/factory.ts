
import { firebaseContestRepository } from "./repositories/firebaseContestsRepository";
import { firebaseJudgesRepository } from "./repositories/firebaseJudgesRepository";

import { AdminUseCases, JudgeUseCases } from "./useCases";


export const adminUseCases = new AdminUseCases(firebaseContestRepository, firebaseJudgesRepository);
export const judgeUseCases = new JudgeUseCases(firebaseContestRepository, firebaseJudgesRepository);
