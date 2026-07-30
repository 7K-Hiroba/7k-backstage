import { createBackend } from '@backstage/backend-defaults';
import { ConfigSources } from '@backstage/config-loader';
import { authModuleKeycloakOIDCProvider } from './plugins/auth';
import { authModuleOidcProvider } from './plugins/oidc';
import { cnoeScaffolderActions } from './modules/scaffolder';

async function main() {
  const backend = createBackend();

  // Feature flags are the single switch for both frontend UI and backend
  // plugin registration. They default to true and can be overridden via any
  // app-config overlay or via env vars (e.g. FEATURE_KRO=false), which are
  // substituted into app-config.yaml.
  const config = await ConfigSources.toConfig(
    ConfigSources.default({ argv: process.argv }),
  );
  const featureEnabled = (name: string) =>
    config.getOptionalBoolean(`features.${name}`) ?? true;

  // Detect if running inside a Kubernetes cluster
  const isInCluster = require('fs').existsSync(
    '/var/run/secrets/kubernetes.io/serviceaccount/token',
  );

  const k8sEnabled =
    (process.env.K8S_CLUSTER_URL || isInCluster) &&
    featureEnabled('kubernetes');

  // Core plugins
  backend.add(import('@backstage/plugin-app-backend'));
  if (process.env.MOCK_MODE === 'true') {
    backend.add(import('./plugins/mock-proxy'));
  } else {
    backend.add(import('@backstage/plugin-proxy-backend'));
  }
  if (featureEnabled('techDocs')) {
    backend.add(import('@backstage/plugin-techdocs-backend'));
  }

  // Scaffolder
  if (featureEnabled('scaffolder')) {
    backend.add(import('@backstage/plugin-scaffolder-backend'));
    backend.add(
      import(
        '@backstage/plugin-catalog-backend-module-scaffolder-entity-model'
      ),
    );

    // Scaffolder modules that require external services — skip if not configured
    if (process.env.GITHUB_TOKEN) {
      backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));
    }

    // CNOE custom scaffolder actions (gitea publish, argocd, k8s-apply, sanitize, verify)
    backend.add(cnoeScaffolderActions);

    // Roadie scaffolder modules
    backend.add(import('@roadiehq/scaffolder-backend-module-utils'));
    backend.add(import('@roadiehq/scaffolder-backend-module-http-request'));
    if (k8sEnabled) {
      backend.add(import('@roadiehq/scaffolder-backend-argocd'));
    }
  }

  // Auth
  backend.add(import('@backstage/plugin-auth-backend'));
  backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));

  // Catalog
  backend.add(import('@backstage/plugin-catalog-backend'));

  // Permission
  backend.add(import('@backstage/plugin-permission-backend'));
  backend.add(
    import('@backstage/plugin-permission-backend-module-allow-all-policy'),
  );

  // Search
  if (featureEnabled('search')) {
    backend.add(import('@backstage/plugin-search-backend'));
    backend.add(import('@backstage/plugin-search-backend-module-catalog'));
    backend.add(
      import('@backstage/plugin-search-backend-module-techdocs/alpha'),
    );
  }

  // Kubernetes
  if (process.env.MOCK_MODE === 'true') {
    backend.add(import('./plugins/mock-kubernetes'));
  } else if (k8sEnabled) {
    backend.add(import('@backstage/plugin-kubernetes-backend'));
    backend.add(import('@terasky/backstage-plugin-kubernetes-ingestor'));
    if (featureEnabled('kro')) {
      backend.add(import('@terasky/backstage-plugin-kro-resources-backend'));
    }
  }

  // Keycloak OIDC auth
  if (process.env.KEYCLOAK_URL) {
    backend.add(authModuleKeycloakOIDCProvider);
  }

  // Generic OIDC auth (any OIDC-compliant IdP; custom module with
  // catalog-aware sign-in and IdP groups claim forwarding)
  if (process.env.OIDC_METADATA_URL) {
    backend.add(authModuleOidcProvider);
  }

  if (process.env.MOCK_MODE === 'true') {
    backend.add(import('./plugins/mock-argocd'));
  }

  await backend.start();
}

main().catch(error => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
