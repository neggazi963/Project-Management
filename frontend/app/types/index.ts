export interface User {
  _id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: Date;
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: User | string;
  color: string;
  members: {
    user: User;
    role: "admin" | "member" | "owner" | "viewer";
    joinedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
