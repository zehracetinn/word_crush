export interface UserProfile {
  username: string;
  gold: number;
  ownedJokers: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}