import { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { examples } from './gitea-actions';
import { LoggerService } from '@backstage/backend-plugin-api';
import { ArgoService } from '@roadiehq/backstage-plugin-argo-cd-backend';

export function createArgoCDApp(options: {
  config: Config;
  logger: LoggerService;
}) {
  const { config, logger } = options;

  return createTemplateAction({
    id: 'cnoe:create-argocd-app',
    description: 'creates argocd app',
    examples,
    schema: {
      input: {
        repoUrl: z => z.string().describe('Repository Location'),
        projectName: z => z.string().describe('name of the project in argocd'),
        appName: z => z.string().describe('application name in argocd'),
        appNamespace: z =>
          z.string().describe('application namespace in argocd'),
        argoInstance: z =>
          z
            .string()
            .describe(
              'backstage argocd instance name defined in app-config.yaml',
            ),
        path: z => z.string().describe('argocd spec path'),
        labelValue: z =>
          z
            .string()
            .optional()
            .describe('for argocd plugin to locate this app'),
      },
    },
    async handler(ctx) {
      const {
        repoUrl,
        projectName,
        appName,
        argoInstance,
        path,
        labelValue,
        appNamespace,
      } = ctx.input;

      const argoUserName =
        config.getOptionalString('argocd.username') ?? 'argocdUsername';
      const argoPassword =
        config.getOptionalString('argocd.password') ?? 'argocdPassword';

      const argoSvc = new ArgoService(
        argoUserName,
        argoPassword,
        config,
        logger as any,
      );

      const argocdConfig = config
        .getConfigArray('argocd.appLocatorMethods')
        .filter(element => element.getString('type') === 'config')
        .reduce(
          (acc: Config[], argoApp: Config) =>
            acc.concat(argoApp.getConfigArray('instances')),
          [],
        )
        .map(instance => ({
          name: instance.getString('name'),
          url: instance.getString('url'),
          token: instance.getOptionalString('token'),
          username: instance.getOptionalString('username'),
          password: instance.getOptionalString('password'),
        }));

      const matchedArgoInstance = argocdConfig.find(
        argoHost => argoHost.name === argoInstance,
      );
      if (!matchedArgoInstance) {
        throw new Error(`Unable to find Argo instance named "${argoInstance}"`);
      }
      const token =
        matchedArgoInstance.token ||
        (await argoSvc.getArgoToken(matchedArgoInstance));

      await argoSvc.createArgoApplication({
        baseUrl: matchedArgoInstance.url,
        argoToken: token,
        appName,
        projectName: projectName ? projectName : appName,
        namespace: appNamespace,
        sourceRepo: repoUrl,
        sourcePath: path,
        labelValue: labelValue ? labelValue : appName,
      });
    },
  });
}
