export interface User {
  _id: string;
  email: string;
  name: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}
