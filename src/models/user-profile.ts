export interface UserProfile {
  id: string;
  username: string;
  gold: number;
  ownedJokers: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}
