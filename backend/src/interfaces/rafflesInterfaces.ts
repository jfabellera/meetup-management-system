export interface RaffleWinnerInfo {
  ticketId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  wins: number;
}

export interface RaffleRecordResponse {
  id: number;
  isBatchRoll: boolean;
  winners: RaffleWinnerInfo[];
  winnersClaimed: number[];
  wasDisplayed: boolean;
  createdAt: Date;
}
