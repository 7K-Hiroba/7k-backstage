import { configApiRef, useApi } from '@backstage/core-plugin-api';

export const featureFlags = [
  'search',
  'apiDocs',
  'techDocs',
  'scaffolder',
  'techRadar',
  'catalogGraph',
  'catalogImport',
  'kubernetes',
  'kro',
  'argoWorkflows',
  'argocd',
  'agentForge',
] as const;

export type FeatureFlag = (typeof featureFlags)[number];

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const useFeatureFlags = (): FeatureFlags => {
  const configApi = useApi(configApiRef);
  const flags = {} as FeatureFlags;
  for (const flag of featureFlags) {
    flags[flag] = configApi.getOptionalBoolean(`features.${flag}`) ?? true;
  }
  return flags;
};

export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  const configApi = useApi(configApiRef);
  return configApi.getOptionalBoolean(`features.${flag}`) ?? true;
};
