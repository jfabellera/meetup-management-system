export interface RaffleWinnerInfo {
  ticketId: number;
  displayName: string;
  firstName: string;
  lastName: string;
  wins: number;
}
export interface RaffleWinnerResponse {
  raffleRecordId: number;
  winners: RaffleWinnerInfo[];
}
