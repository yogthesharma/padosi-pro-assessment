import type { AccountUser, OnboardingStep, ProfileInput } from '@padosipro/shared';
import type { Clock } from '../../lib/clock.js';
import type { Profile, ProfileRepository } from '../profile/profile.repository.js';
import type { TasksRepository } from '../tasks/tasks.repository.js';
import type { User } from '../users/users.repository.js';

/** Serialises to the shared AccountResponse wire type. */
export interface AccountView {
  user: AccountUser;
  profile: Omit<Profile, 'userId'> | null;
}

export type AccountService = ReturnType<typeof createAccountService>;

export function createAccountService(deps: { profiles: ProfileRepository; tasks: TasksRepository; clock: Clock }) {
  return {
    async getAccount(user: User): Promise<AccountView> {
      const [profile, selectedTaskCount] = await Promise.all([
        deps.profiles.findByUserId(user.id),
        deps.tasks.countSelected(user.id),
      ]);
      const onboardingStep: OnboardingStep = !profile ? 'profile' : selectedTaskCount === 0 ? 'tasks' : 'home';

      return {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerifiedAt !== null,
          profileCompleted: profile !== null,
          selectedTaskCount,
          onboardingStep,
        },
        profile: profile ? withoutUserId(profile) : null,
      };
    },

    async saveProfile(userId: string, input: ProfileInput) {
      return withoutUserId(await deps.profiles.upsert(userId, input, deps.clock.now()));
    },
  };
}

const withoutUserId = ({ userId: _userId, ...profile }: Profile) => profile;
