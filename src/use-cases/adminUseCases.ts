import { Category, Contest, ContestRepository, Judge, Participant, JudgesRepository, generateId, Score, UsersRepository, RankingData, User } from "../domain";


export class AdminUseCases {
  private contestRepository: ContestRepository;
  private judgesRepository: JudgesRepository;
  private usersRepository: UsersRepository;

  constructor(contestRepository: ContestRepository, judgesRepository: JudgesRepository, usersRepository: UsersRepository) {
    this.contestRepository = contestRepository;
    this.judgesRepository = judgesRepository;
    this.usersRepository = usersRepository;
  }

  async authenticate(email: string, password: string): Promise<void> {
    return this.usersRepository.authenticate(email, password);
  }

  signOut(): void {
    this.usersRepository.signOut();
  }

  useIsAuthenticated(callback: (authenticated: boolean) => void) {
    this.usersRepository.onAuthenticatedChanged(callback)
  }

  getAuthenticatedUserEmail(): string {
    return this.usersRepository.getAuthenticatedUserEmail()
  }

  selfSignUp(email: string, password: string) {
    const contestId = generateId();
    this.usersRepository.registerUser(contestId, email, password).then((user: User) => {
      this.createNewContest(contestId, "");
      this.contestRepository.addAdminToContest(contestId, user) // FIXME security rules
    });
  }

  sendPasswordResetEmail(email: string) {
    this.usersRepository.sendPasswordResetEmail(email);
  }

  sendAdminInvitation(email: string): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.usersRepository.registerUser(contestId, email, generateId()).then((user: User) => {
      this.contestRepository.addAdminToContest(contestId, user);
      this.usersRepository.sendPasswordResetEmail(email);
    }).catch((e) => {
      console.log(e);
      // most likely the user email already exists, so try to add that.
      this.usersRepository.getUserByEmail(email).then((user: User) => {
        this.contestRepository.addAdminToContest(contestId, user);
      });
    });
  }

  removeAdminFromContest(contestId: string, userId: string): void {
    console.log(contestId, userId)
    // this.usersRepository.removeContestFromUser(contestId, userId).then(() => {
    //   this.contestRepository.removeUserFromContest(contestId, userId);
    // });
  }
  
  addContest() {
    const contestId = generateId();
    const user = this.usersRepository.getAuthenticatedUser();
    if (user === null) {
      return
    }
    this.createNewContest(contestId, "New contest");
    this.contestRepository.addAdminToContest(contestId, user);
    this.usersRepository.addContestToUser(user.id, contestId);
    this.setActiveContest(contestId);
  }

  deleteContest(contestId: string) {
    this.contestRepository.getContestAdmins(contestId).then(userIds => {
      userIds.forEach(userId => {
        this.usersRepository.deleteContestFromUser(userId, contestId);
      })
    }).then(() => {
      this.contestRepository.deleteContest(contestId);
    });
  }

  createNewContest(contestId: string, name: string): Contest {
    const rankingId = generateId();
    const scoreAreaId = generateId();
    const categoryId = generateId();
    const contest: Contest = {
      id: contestId,
      name: name,
      description: "",
      logo: null,
      scoreAreas: {
        [scoreAreaId]: {
          id: scoreAreaId,
          name: "Score gebied",
          comment: "",
          maximumScore: 5
        }
      },
      categories: {
        [categoryId]: {
          id: categoryId,
          name: "Thema"
        }
      },
      rankings: {
        [rankingId]: {
          id: rankingId,
          name: "Rangschikking",
          perCategory: false,
          scoreAreas: {
            scoreAreaId: true
          },
        }
      }
    }
    this.contestRepository.storeContest(contest);
    return contest;
  }

  storeContest(contest: Contest): void {
    this.contestRepository.storeContest(contest);
  }
  
  addCategory(contest: Contest, name: string): void {
    const category = {
      id: generateId(),
      name: name,
    }
    const newContest: Contest = {
      ...contest,
      categories: {
        ...contest.categories,
        [category.id]: category,
      }
    }
    this.storeContest(newContest);
  }

  deleteCategory(contest: Contest, categoryId: string){
    const newContest: Contest = {
      ...contest,
      categories: Object.entries(contest.categories).reduce((acc, [key, val]) => {
        if(key === categoryId) {
          return acc;
        }
        return {...acc, [key]: val}
      }, {})
    }
    this.contestRepository.storeContest(newContest);
    
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.deleteCategoryFromAllScoreEntries(contestId, categoryId);
  }

  addScoreArea(contest: Contest, name: string, comment: string, maximumScore: number): void {
    const scoreArea = {
      id: generateId(),
      name: name,
      comment: comment,
      maximumScore: maximumScore,
    }
    const newContest: Contest = {
      ...contest,
      scoreAreas: {
        ...contest.scoreAreas,
        [scoreArea.id]: scoreArea,
      }
    }
    this.storeContest(newContest);
  }

  addRanking(contest: Contest, name: string, scoreAreas: {[key: string]: boolean}, perCategory: boolean): void {
    const ranking = {
      id: generateId(),
      name: name,
      scoreAreas: scoreAreas,
      perCategory: perCategory
    }
    const newContest: Contest = {
      ...contest,
      rankings: {
        ...contest.rankings,
        [ranking.id]: ranking,
      }
    }
    this.storeContest(newContest);
  }

  addParticipant(code: string, name: string, category: Category): Participant {
    const participant = {
      id: generateId(),
      code: code,
      name: name,
      category: category,
      judgedBy: [],
    }
    this.storeParticipant(participant);
    return participant;
  }

  storeParticipant(participant: Participant): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.storeParticipant(contestId, participant);
  }

  addJudge(name: string): Judge{
    const contestId = this.usersRepository.getActiveContestId();
    const id = generateId();
    const key = generateId();

    this.judgesRepository.createJudge(contestId, id, key);
    const judge = {
      id: id,
      name: name,
    }
    this.judgesRepository.storeJudge(contestId, judge);
    return judge
  }

  storeJudge(judge: Judge): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.judgesRepository.storeJudge(contestId, judge);
  }

  useActiveContest(callback: (contest: Contest) => void) {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, callback)
  }

  async getAuthenticatedUserAvailableContests(): Promise<{contests: Array<Contest>, activeContestId: string}> {
    const contestIds = await this.usersRepository.getAuthenticatedUserAvailableContests();
    const activeContestId = this.usersRepository.getActiveContestId();
    return this.contestRepository.getContestsByIds(contestIds).then(contests => ({
      contests: contests, activeContestId: activeContestId
    }));
  }

  setActiveContest(contestId: string) {
    this.usersRepository.setActiveContest(contestId).then(() => {
      window.location.reload();
    });
  }

  useActiveContestAdmins(callback: (users: Array<User>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onAdminsChanged(contestId, userIds => {
      this.usersRepository.onUsersChanged(userIds, callback)
    })
  }

  useParticipants(callback: (particpants: Array<Participant>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    const sortFunction = (a: Participant, b: Participant) => {
      let aCode: number | string = a.code;
      let bCode: number | string = b.code;
      try {
        aCode = parseFloat(a.code);
        bCode = parseFloat(b.code);
      }
      catch {};

      if (aCode > bCode){
        return 1;
      }
      if (aCode < bCode){
        return -1;
      }
      return 0;
    }

    this.contestRepository.onParticipantsChanged(contestId, (particpants) => {
      callback(particpants.sort(sortFunction));
    })
  }

  useCategories(callback: (categories: Array<Category>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.contestRepository.onContestChanged(contestId, contest => callback(Object.values(contest.categories)))
  }

  useJudges(callback: (judges: Array<Judge>) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
    this.judgesRepository.onJudgesChanged(contestId, judges => callback(judges.sort((a, b) => {if(a.name > b.name) return 1; if(a.name < b.name) return -1; return 0;})));
  }

  useJudgeQrCodeData(judge: Judge, callback: (data: null | {url: string, host: string, contestId: string, judgeId: string, judgeKey: string}) => void): void {
    const contestId = this.usersRepository.getActiveContestId();

    this.judgesRepository.getJudgeKey(contestId, judge.id, (judgeKey: string | null) => {
      if(judgeKey === null) {
        callback(null);
        return
      }
      callback({
        url: `http://${window.location.host}/?key=${judge.id}@${contestId}@${judgeKey}`,
        host: window.location.host,
        contestId: contestId,
        judgeId: judge.id,
        judgeKey: judgeKey
      });
    });
  }

  useJudgeParticipantScores(judgeId: string, callback: (data: Array<{participant: Participant, total: number, scoreAreas: {[scoreAreaId: string]: number}}>, contest: Contest) => void): void{
    const contestId = this.usersRepository.getActiveContestId();

    let participantScores: Array<Score> = [];

    this.contestRepository.onContestChanged(contestId, (contest: Contest) => {
      this.contestRepository.onParticipantsChanged(contestId, (participants: Array<Participant>) => {
        this.contestRepository.onScoresChanged(contestId, (scores: Array<Score>) => {

          const participantsMap: {[key:  string]: Participant} = participants.reduce((acc, participant) => ({...acc, [participant.id]: participant}), {});

          scores.forEach(score => {
            if(score.judgeId == judgeId) {
              participantScores.push(score);
            }
          })
          const data = participantScores.map(score => ({
            participant: participantsMap[score.participantId],
            total: Object.values(contest.scoreAreas).reduce((acc, scoreArea) => acc + (score.score[scoreArea.id] || 0), 0),
            scoreAreas: {
              ...Object.values(contest.scoreAreas).reduce((acc, scoreArea) => ({
                ...acc,
                [scoreArea.id]: score.score[scoreArea.id] || 0
              }), {}),
            }
          }));


          callback(data, contest);
        })
      })
    })
  }

  useParticipantScores(callback: (rankingData: {[key: string]: RankingData}, contest: Contest) => void): void {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.contestRepository.onContestChanged(contestId, (contest: Contest) => {
      this.judgesRepository.onJudgesChanged(contestId, (judges: Array<Judge>) => {
        this.contestRepository.onParticipantsChanged(contestId, (participants: Array<Participant>) => {
          this.contestRepository.onScoresChanged(contestId, (scores: Array<Score>) => {

            let participantScoreMap: {[key: string]: Array<Score>} = {}

            scores.forEach(score => {
              if( participantScoreMap[score.participantId] === undefined ) {
                participantScoreMap[score.participantId] = [];
              }
              participantScoreMap[score.participantId].push(score);
            })
            let numberOfParticipantScores: {[key: string]: number} = Object.entries(participantScoreMap).reduce((acc, [key, val]) => ({...acc, [key]: val.length}), {})

            const judgesMap: {[key:  string]: Judge} = judges.reduce((acc, judge) => ({...acc, [judge.id]: judge}), {});

            const participantJudgeScores: Array<{
                [participantId:  string]: {
                  [key:  string]: {
                    judge: Judge,
                    total: number,
                    scoreAreas: {
                      [scoreAreaId: string]: number,
                    }
                  }
                }
              }> = Object.values(contest.rankings).map(ranking => 
                participants.reduce((acc1, participant) => ({
                  ...acc1,
                  [participant.id]: (participantScoreMap[participant.id] || []).reduce((acc, score) => ({
                    ...acc,
                    [score.id]: {
                      judge: judgesMap[score.judgeId],
                      total: Object.values(contest.scoreAreas).filter(scoreArea => ranking.scoreAreas[scoreArea.id]).reduce((acc, scoreArea) => acc + (score.score[scoreArea.id] || 0), 0),
                      scoreAreas: {
                        ...Object.values(contest.scoreAreas).filter(scoreArea => ranking.scoreAreas[scoreArea.id]).reduce((acc, scoreArea) => ({
                          ...acc,
                          [scoreArea.id]: score.score[scoreArea.id] || 0
                        }), {}),
                      }
                    }
                  }), {})
                }), {})
            )

            const data: {[key: string]: RankingData} = Object.values(contest.rankings).map((ranking, index) => ({
              ranking: ranking,
              participantScoreData: participants.map((participant: Participant) => ({
                participant: participant,
                totalScore: {
                  total: Object.values(participantJudgeScores[index][participant.id]).reduce((acc, data) => acc + data.total/ (numberOfParticipantScores[participant.id] || 1), 0),
                  scoreAreas: Object.values(participantJudgeScores[index][participant.id]).reduce((acc1: {[key: string]: number}, data) => Object.keys(contest.scoreAreas).filter(key => ranking.scoreAreas[key]).reduce((acc2, key: string) => ({
                    ...acc2,
                    [key]: (acc1[key] === undefined ? 0 : acc1[key]) + (data.scoreAreas[key] || 0) / (numberOfParticipantScores[participant.id] || 1)
                  }), {}), {}),
                },
                judgeScores: participantJudgeScores[index][participant.id]
              }))
            })).reduce((acc, val) => ({...acc, [val.ranking.id]: val}), {});

            callback(data, contest)

          });
        });
      });
    });

  }

  deleteParticipant(participantId: string) {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.contestRepository.deleteParticipant(contestId, participantId);
    this.contestRepository.deleteAllParticipantScores(contestId, participantId);
  }

  deleteJudge(judgeId: string) {
    const contestId = this.usersRepository.getActiveContestId();
   
    this.judgesRepository.deleteJudge(contestId, judgeId);
    this.judgesRepository.deleteJudgeKey(contestId, judgeId);
    this.contestRepository.deleteAllJudgeScores(contestId, judgeId);
  }

  updateContestLogo(contestId: string, file: File) {
    this.contestRepository.uploadContestLogo(contestId, file);
  }
}



