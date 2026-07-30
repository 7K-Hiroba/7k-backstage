import { ConfigSources } from '@backstage/config-loader';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

describe('feature flags configuration', () => {
  let tmpDir: string;
  let originalEnv: Record<string, string | undefined> = {};

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'feature-flags-test-'));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    originalEnv = {};
  });

  const setEnv = (key: string, value: string | undefined) => {
    if (!(key in originalEnv)) {
      originalEnv[key] = process.env[key];
    }
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  };

  const loadConfig = async (content: string) => {
    const configPath = path.join(tmpDir, 'app-config.yaml');
    await fs.writeFile(configPath, content, 'utf8');

    const source = ConfigSources.defaultForTargets({
      rootDir: tmpDir,
      targets: [{ type: 'path', target: configPath }],
    });
    return ConfigSources.toConfig(source);
  };

  it('loads feature flags with default values when env vars are unset', async () => {
    const config = await loadConfig(`
features:
  kro: \${FEATURE_KRO:-true}
  search: \${FEATURE_SEARCH:-true}
  agentForge: \${FEATURE_AGENT_FORGE:-true}
`);

    expect(config.getOptionalBoolean('features.kro')).toBe(true);
    expect(config.getOptionalBoolean('features.search')).toBe(true);
    expect(config.getOptionalBoolean('features.agentForge')).toBe(true);

    await config.close();
  });

  it('overrides feature flags via env vars', async () => {
    setEnv('FEATURE_KRO', 'false');
    setEnv('FEATURE_AGENT_FORGE', 'false');

    const config = await loadConfig(`
features:
  kro: \${FEATURE_KRO:-true}
  search: \${FEATURE_SEARCH:-true}
  agentForge: \${FEATURE_AGENT_FORGE:-true}
`);

    expect(config.getOptionalBoolean('features.kro')).toBe(false);
    expect(config.getOptionalBoolean('features.search')).toBe(true);
    expect(config.getOptionalBoolean('features.agentForge')).toBe(false);

    await config.close();
  });

  it('coerces string values from env substitution to booleans', async () => {
    setEnv('FEATURE_KRO', 'false');

    const config = await loadConfig(`
features:
  kro: \${FEATURE_KRO:-true}
`);

    expect(config.getOptionalBoolean('features.kro')).toBe(false);

    await config.close();
  });

  it('allows app-config overlay to override env-substituted defaults', async () => {
    setEnv('FEATURE_KRO', 'true');

    const config = await loadConfig(`
features:
  kro: false
`);

    expect(config.getOptionalBoolean('features.kro')).toBe(false);

    await config.close();
  });
});
