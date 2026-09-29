/** Response bodies as they travel over the wire (dates are ISO strings). */

/** Where a logged-in user should go next. The server decides, so a reinstall can't skip a step. */
export type OnboardingStep = 'profile' | 'tasks' | 'home';

export interface AccountUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  selectedTaskCount: number;
  onboardingStep: OnboardingStep;
}

export interface ProfileDto {
  name: string;
  mobile: string;
  address: string;
  businessName: string | null;
  updatedAt: string;
}

export interface AccountResponse {
  user: AccountUser;
  profile: ProfileDto | null;
}

export interface SessionResponse extends AccountResponse {
  token: string;
  expiresAt: string;
}

export interface OtpSendStatusDto {
  resendAvailableInSeconds: number;
  codeValidForSeconds: number;
}

export interface RegisterResponse extends OtpSendStatusDto {
  email: string;
  verificationRequired: true;
  sent: boolean;
}

/** `details` of a 403 EMAIL_NOT_VERIFIED error from login. */
export interface EmailNotVerifiedDetails extends OtpSendStatusDto {
  email: string;
  sent: boolean;
}

export interface ResendCodeResponse extends OtpSendStatusDto {
  message: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  /** Feather icon name. */
  icon: string;
  tasks: Task[];
}

export interface SelectedTask extends Task {
  category: { id: string; name: string; icon: string };
}

export interface CatalogueResponse {
  categories: TaskCategory[];
}

export interface SelectedTasksResponse {
  tasks: SelectedTask[];
}
