import { stringifyEntityRef } from '@backstage/catalog-model';
import { JsonArray } from '@backstage/types';
import { createBackendModule } from '@backstage/backend-plugin-api';
import {
  authProvidersExtensionPoint,
  createOAuthProviderFactory,
  OAuthAuthenticatorResult,
} from '@backstage/plugin-auth-node';
import {
  oidcAuthenticator,
  OidcAuthResult,
} from '@backstage/plugin-auth-backend-module-oidc-provider';

// Generic OIDC provider (id "oidc") — works with any OIDC-compliant IdP.
// Like the stock auth-backend-module-oidc-provider, but with a custom
// sign-in resolver that:
//   1. resolves the user from the catalog by profile email
//      (falling back to the email local part, so login still works
//      for users not yet in the catalog), and
//   2. forwards the IdP "groups" claim into the Backstage token.
export const authModuleOidcProvider = createBackendModule({
  pluginId: 'auth',
  moduleId: 'oidc',
  register(reg) {
    reg.registerInit({
      deps: {
        providers: authProvidersExtensionPoint,
      },
      async init({ providers }) {
        providers.registerProvider({
          providerId: 'oidc',
          factory: createOAuthProviderFactory({
            authenticator: oidcAuthenticator,
            profileTransform: async (
              input: OAuthAuthenticatorResult<OidcAuthResult>,
            ) => ({
              profile: {
                email: input.fullProfile.userinfo.email,
                picture: input.fullProfile.userinfo.picture,
                displayName: input.fullProfile.userinfo.name,
              },
            }),
            async signInResolver(info, ctx) {
              const email = info.profile.email;
              if (!email) {
                throw new Error(
                  'Login failed, user profile does not contain an email',
                );
              }
              const groups =
                (info.result.fullProfile.userinfo.groups as JsonArray) || [];

              let userRef: string;
              let ent: string[];
              try {
                const { entity } = await ctx.findCatalogUser({
                  filter: { kind: 'User', 'spec.profile.email': email },
                });
                userRef = stringifyEntityRef(entity);
                const resolved = await ctx.resolveOwnershipEntityRefs(entity);
                ent = resolved.ownershipEntityRefs;
              } catch {
                userRef = stringifyEntityRef({
                  kind: 'User',
                  name: email.split('@')[0],
                  namespace: 'default',
                });
                ent = [userRef];
              }

              return ctx.issueToken({
                claims: {
                  sub: userRef,
                  ent,
                  groups,
                },
              });
            },
          }),
        });
      },
    });
  },
});
