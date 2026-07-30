import { configApiRef } from '@backstage/core-plugin-api';
import {
  renderInTestApp,
  TestApiProvider,
  mockApis,
} from '@backstage/test-utils';
import { useFeatureFlags } from './useFeatureFlags';

const TestComponent = () => {
  const flags = useFeatureFlags();
  return (
    <div>
      <div data-testid="search">{String(flags.search)}</div>
      <div data-testid="apiDocs">{String(flags.apiDocs)}</div>
      <div data-testid="kro">{String(flags.kro)}</div>
      <div data-testid="argoWorkflows">{String(flags.argoWorkflows)}</div>
      <div data-testid="agentForge">{String(flags.agentForge)}</div>
    </div>
  );
};

describe('useFeatureFlags', () => {
  it('defaults all flags to true when no features config is provided', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider apis={[[configApiRef, mockApis.config({ data: {} })]]}>
        <TestComponent />
      </TestApiProvider>,
    );

    expect(getByTestId('search')).toHaveTextContent('true');
    expect(getByTestId('apiDocs')).toHaveTextContent('true');
    expect(getByTestId('kro')).toHaveTextContent('true');
    expect(getByTestId('argoWorkflows')).toHaveTextContent('true');
    expect(getByTestId('agentForge')).toHaveTextContent('true');
  });

  it('reads explicit false values from features config', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [
            configApiRef,
            mockApis.config({
              data: {
                features: {
                  kro: false,
                  argoWorkflows: false,
                },
              },
            }),
          ],
        ]}
      >
        <TestComponent />
      </TestApiProvider>,
    );

    expect(getByTestId('search')).toHaveTextContent('true');
    expect(getByTestId('apiDocs')).toHaveTextContent('true');
    expect(getByTestId('kro')).toHaveTextContent('false');
    expect(getByTestId('argoWorkflows')).toHaveTextContent('false');
    expect(getByTestId('agentForge')).toHaveTextContent('true');
  });

  it('reads explicit true values from features config', async () => {
    const { getByTestId } = await renderInTestApp(
      <TestApiProvider
        apis={[
          [
            configApiRef,
            mockApis.config({
              data: {
                features: {
                  search: true,
                  kro: true,
                },
              },
            }),
          ],
        ]}
      >
        <TestComponent />
      </TestApiProvider>,
    );

    expect(getByTestId('search')).toHaveTextContent('true');
    expect(getByTestId('kro')).toHaveTextContent('true');
  });
});
