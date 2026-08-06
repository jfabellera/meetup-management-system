export const DEFAULT_DISPLAY_IDLE_INTERVAL_SECONDS = 15;

export interface MeetupDisplayAssets {
  idleImageUrls: string[] | null;
  raffleWinnerBackgroundImageUrl: string | null;
  batchRaffleWinnerBackgroundImageUrl: string | null;
  idleIntervalSeconds: number;
}
