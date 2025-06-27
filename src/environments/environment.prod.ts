import { EnvironmentSecrets } from './environment-secrets';

export interface Environment {
  prodMode: boolean;
  rollbarAccessToken: string;
}

export const environment: Environment = {
  prodMode: true,
  rollbarAccessToken: EnvironmentSecrets.rollbarAccessToken, // Roll Bar Production API key
};
