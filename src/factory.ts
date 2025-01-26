
import { firebaseContestRepository } from "./repositories/firebaseContestsRepository";
import { firebaseJudgesRepository } from "./repositories/firebaseJudgesRepository";
import { firebaseUsersRepository } from "./repositories/firebaseUsersRepository";

import { AdminUseCases } from "./use-cases/adminUseCases";
import { JudgeUseCases } from "./use-cases/judgeUseCases";
import { ViewUseCases } from "./use-cases/viewUseCases";


export const adminUseCases = new AdminUseCases(firebaseContestRepository, firebaseJudgesRepository, firebaseUsersRepository);
export const judgeUseCases = new JudgeUseCases(firebaseContestRepository, firebaseJudgesRepository);
export const viewUseCases = new ViewUseCases();