export const HOUSEHOLD_ROLES = {
  owner: "owner",
  member: "member",
} as const;

export type HouseholdRole = (typeof HOUSEHOLD_ROLES)[keyof typeof HOUSEHOLD_ROLES];

export const SCORE_WINDOW_DAYS = 14;
export const SCORE_WINDOW_MS = SCORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type IsoTimestamp = string;
export type Uuid = string;

export interface Household {
  id: Uuid;
  name: string;
  owner_id: Uuid;
  created_at: IsoTimestamp;
}

export interface HouseholdMember {
  id: Uuid;
  household_id: Uuid;
  user_id: Uuid;
  role: HouseholdRole;
  created_at: IsoTimestamp;
}

export interface Chore {
  id: Uuid;
  household_id: Uuid;
  name: string;
  weight: number;
  created_by: Uuid;
  created_at: IsoTimestamp;
}

export interface ChoreCompletion {
  id: Uuid;
  household_id: Uuid;
  chore_id: Uuid;
  completed_by: Uuid;
  completed_at: IsoTimestamp;
  undone_at: IsoTimestamp | null;
  undone_by: Uuid | null;
  created_at: IsoTimestamp;
}

export interface HouseholdInvite {
  id: Uuid;
  household_id: Uuid;
  token: string;
  created_by: Uuid;
  created_at: IsoTimestamp;
  disabled_at: IsoTimestamp | null;
}

export interface FairnessScoreCompletion {
  completed_by: Uuid;
  completed_at: IsoTimestamp | Date;
  undone_at: IsoTimestamp | Date | null;
  weight: number;
}

export interface FairnessScoreMember {
  user_id: Uuid;
  raw_points: number;
  percentage: number;
}

export interface FairnessScoreResult {
  window_start: IsoTimestamp;
  window_end: IsoTimestamp;
  total_points: number;
  members: FairnessScoreMember[];
}

export interface ActiveCompletionWithChore extends ChoreCompletion {
  chores: Pick<Chore, "id" | "name" | "weight"> | null;
}

interface TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export interface HouseholdDatabase {
  public: {
    Tables: {
      households: TableDefinition<
        Household,
        Pick<Household, "name" | "owner_id"> & Partial<Pick<Household, "id" | "created_at">>
      >;
      household_members: TableDefinition<
        HouseholdMember,
        Pick<HouseholdMember, "household_id" | "user_id" | "role"> & Partial<Pick<HouseholdMember, "id" | "created_at">>
      >;
      chores: TableDefinition<
        Chore,
        Pick<Chore, "household_id" | "name" | "weight" | "created_by"> & Partial<Pick<Chore, "id" | "created_at">>
      >;
      chore_completions: TableDefinition<
        ChoreCompletion,
        Pick<ChoreCompletion, "household_id" | "chore_id" | "completed_by"> &
          Partial<Pick<ChoreCompletion, "id" | "completed_at" | "undone_at" | "undone_by" | "created_at">>,
        Partial<Pick<ChoreCompletion, "undone_at" | "undone_by">>
      >;
      household_invites: TableDefinition<
        HouseholdInvite,
        Pick<HouseholdInvite, "household_id" | "token" | "created_by"> &
          Partial<Pick<HouseholdInvite, "id" | "created_at" | "disabled_at">>,
        Partial<Pick<HouseholdInvite, "disabled_at">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      create_household_with_owner: {
        Args: { household_name: string };
        Returns: Uuid;
      };
      join_household_with_invite: {
        Args: { invite_token: string };
        Returns: Uuid;
      };
      is_household_member: {
        Args: { target_household_id: Uuid };
        Returns: boolean;
      };
      is_household_owner: {
        Args: { target_household_id: Uuid };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
