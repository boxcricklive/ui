export interface BallDto {
  matchId?: string;
  inningsNo?: number;
  overNumber?: number;
  ballNumber?: number;
  teamBattingId?: string;
  strikerUsername?: string;
  nonStrikerUsername?: string;
  bowlerUsername?: string;
  runsOffBat?: number;
  isWide?: boolean;
  isNoBall?: boolean;
  isBye?: boolean;
  isLegBye?: boolean;
  extraRuns?: number;
  isWicket?: boolean;
  wicketType?: string;
  dismissedUsername?: string;
  nextBatterUsername?: string;
  customCommentary?: string;
}

export interface BatterStatsDto {
  playerUsername?: string;
  runs?: number;
  ballsFaced?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: number;
  isOut?: boolean;
}

export interface BowlerStatsDto {
  playerUsername?: string;
  overs?: number;
  maidens?: number;
  runsConceded?: number;
  wickets?: number;
  economyRate?: number;
  extras?: number;
  legalBallsBowled?: number;
}

export interface InningsDto {
  matchId?: string;
  inningsNo?: number;
  battingTeamId?: string;
  battingTeamName?: string;
  bowlingTeamId?: string;
  bowlingTeamName?: string;
  battingStats?: BatterStatsDto[] | null;
  bowlingStats?: BowlerStatsDto[] | null;
  totalRunsScored?: number | null;
  totalWicketsTaken?: number | null;
  totalExtras?: number | null;
  overs?: OverDto[] | null;
}

export interface JoinMatchRequestDto {
  teamId?: string;
  username?: string;
}

export interface LoginRequestDto {
  playerUsername?: string;
  password?: string;
}

export interface MatchDto {
  matchId?: string;
  location?: string | null;
  dateAndTime?: string;
  status?: string;
  adminUsername?: string;
  totalOvers?: number;
  squadStrength?: number;
  tossDetails?: TossDto | null;
  squads?: MatchSquadDto[] | null;
  inningsList?: InningsDto[] | null;
  winningTeamId?: string | null;
  winningTeamName?: string | null;
  playerOfTheMatch?: string | null;
}

export interface MatchSquadDto {
  teamId?: string;
  teamName?: string;
  captainUsername?: string | null;
  squadMembers?: string[];
}

export interface OverDto {
  matchId?: string;
  inningsNo?: number;
  overNo?: number;
  bowlerUsername?: string;
  runsScored?: number;
}

export interface PlayerDto {
  playerUsername?: string;
  playerAlias?: string | null;
  countryCode?: string | null;
  skill?: string | null;
  teamId?: string | null;
  email?: string | null;
}

export interface PlayerStatsDto {
  playerUsername?: string;
  totalRuns?: number | null;
  totalWickets?: number | null;
  battingStrikeRate?: number | null;
  fours?: number | null;
  sixes?: number | null;
  bestBowlingFigures?: string | null;
  bestBattingScore?: string | null;
  recentMatches?: MatchDto[];
}

export interface RefreshTokenRequestDto {
  token?: string;
  refreshToken?: string;
}

export interface SignupRequestDto {
  playerUsername?: string;
  email?: string | null;
  password?: string;
  playerAlias?: string | null;
  countryCode?: string | null;
  skill?: string | null;
}

export interface TeamDto {
  teamId?: string;
  teamName?: string;
  city?: string | null;
  teamOwner?: string | null;
  teamRank?: number | null;
}

export interface TossDto {
  teamWhoWon?: string;
  decision?: string;
}

export interface UndoBallDto {
  matchId?: string;
  inningsNo?: number;
  overNumber?: number;
  ballNumber?: number;
}
