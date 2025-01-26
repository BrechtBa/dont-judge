import { Contest, Category, Ranking, ScoreArea, RankingData, ScoreDataPerParticipant } from "../domain";


export class ViewUseCases {

  getSortedCategories(contest: Contest): Array<Category> {
    return Object.values(contest.categories).sort((a, b) => {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    });
  }

  getSortedRankings(contest: Contest): Array<Ranking> {
    return Object.values(contest.rankings).sort((a, b) => {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    });
  }

  getSortedScoreAreas(contest: Contest): Array<ScoreArea> {
    const sortedRankings = this.getSortedRankings(contest);

    return Object.values(contest.scoreAreas).sort((a: ScoreArea, b: ScoreArea): number => {
      const totalCountA = sortedRankings.reduce((acc, ranking, index) => ranking.scoreAreas[a.id] ? { total: acc.total + index, count: acc.count + 1 } : acc, { total: 0, count: 0 });
      const totalCountB = sortedRankings.reduce((acc, ranking, index) => ranking.scoreAreas[b.id] ? { total: acc.total + index, count: acc.count + 1 } : acc, { total: 0, count: 0 });

      let valA = totalCountA.count === 0 ? -1 : totalCountA.total / totalCountA.count;
      let valB = totalCountB.count === 0 ? -1 : totalCountB.total / totalCountB.count;

      if (valA > valB) {
        return 1;
      }
      if (valA < valB) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
  }

  getScoreDataPerParticipant(rankingData: { [key: string]: RankingData; }): Array<ScoreDataPerParticipant> {

    let participantScoreData: { [key: string]: ScoreDataPerParticipant; } = {};

    Object.values(rankingData).forEach(scoreAreaRankingData => {
      scoreAreaRankingData.participantScoreData.forEach(val => {
        if (participantScoreData[val.participant.id] === undefined) {
          participantScoreData[val.participant.id] = {
            participant: val.participant,
            rankingData: []
          };
        }

        participantScoreData[val.participant.id].rankingData.push({
          ranking: scoreAreaRankingData.ranking,
          score: val
        });

      });
    });

    return Object.values(participantScoreData).sort((a: ScoreDataPerParticipant, b: ScoreDataPerParticipant): number => {
      if (a.participant.code > b.participant.code) {
        return 1;
      }
      if (a.participant.code < b.participant.code) {
        return -1;
      }
      return 0;
    });
  }


}
