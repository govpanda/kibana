/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { memo, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import useObservable from 'react-use/lib/useObservable';
import { HashRouter as Router, Redirect, Switch, Route, RouteProps } from 'react-router-dom';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import styled from 'styled-components';
import { EuiErrorBoundary, EuiPanel, EuiEmptyPrompt, EuiCode } from '@elastic/eui';
import { CoreStart, AppMountParameters } from 'src/core/public';
import { KibanaContextProvider } from '../../../../../../src/plugins/kibana_react/public';
import { EuiThemeProvider } from '../../../../xpack_legacy/common';
import { FleetSetupDeps, FleetConfigType, FleetStartDeps } from '../../plugin';
import { PAGE_ROUTING_PATHS } from './constants';
import { DefaultLayout, WithoutHeaderLayout } from './layouts';
import { Loading, Error } from './components';
import { IngestManagerOverview, EPMApp, AgentPolicyApp, FleetApp, DataStreamApp } from './sections';
import {
  DepsContext,
  ConfigContext,
  useConfig,
  useCore,
  sendSetup,
  sendGetPermissionsCheck,
  licenseService,
  KibanaVersionContext,
} from './hooks';
import { PackageInstallProvider } from './sections/epm/hooks';
import { FleetStatusProvider, useBreadcrumbs } from './hooks';
import { IntraAppStateProvider } from './hooks/use_intra_app_state';
import { UIExtensionsStorage } from './types';
import { UIExtensionsContext } from './hooks/use_ui_extension';

export interface ProtectedRouteProps extends RouteProps {
  isAllowed?: boolean;
  restrictedPath?: string;
}

export const ProtectedRoute: React.FunctionComponent<ProtectedRouteProps> = ({
  isAllowed = false,
  restrictedPath = '/',
  ...routeProps
}: ProtectedRouteProps) => {
  return isAllowed ? <Route {...routeProps} /> : <Redirect to={{ pathname: restrictedPath }} />;
};

const Panel = styled(EuiPanel)`
  max-width: 500px;
  margin-right: auto;
  margin-left: auto;
`;

const ErrorLayout = ({ children }: { children: JSX.Element }) => (
  <EuiErrorBoundary>
    <DefaultLayout showSettings={false}>
      <WithoutHeaderLayout>{children}</WithoutHeaderLayout>
    </DefaultLayout>
  </EuiErrorBoundary>
);

const IngestManagerRoutes = memo<{ history: AppMountParameters['history']; basepath: string }>(
  ({ history, ...rest }) => {
    useBreadcrumbs('base');
    const { agents } = useConfig();

    const { notifications } = useCore();

    const [isPermissionsLoading, setIsPermissionsLoading] = useState<boolean>(false);
    const [permissionsError, setPermissionsError] = useState<string>();
    const [isInitialized, setIsInitialized] = useState(false);
    const [initializationError, setInitializationError] = useState<Error | null>(null);

    useEffect(() => {
      (async () => {
        setIsPermissionsLoading(false);
        setPermissionsError(undefined);
        setIsInitialized(false);
        setInitializationError(null);
        try {
          setIsPermissionsLoading(true);
          const permissionsResponse = await sendGetPermissionsCheck();
          setIsPermissionsLoading(false);
          if (permissionsResponse.data?.success) {
            try {
              const setupResponse = await sendSetup();
              if (setupResponse.error) {
                setInitializationError(setupResponse.error);
              }
            } catch (err) {
              setInitializationError(err);
            }
            setIsInitialized(true);
          } else {
            setPermissionsError(permissionsResponse.data?.error || 'REQUEST_ERROR');
          }
        } catch (err) {
          setPermissionsError('REQUEST_ERROR');
        }
      })();
    }, []);

    if (isPermissionsLoading || permissionsError) {
      return (
        <ErrorLayout>
          {isPermissionsLoading ? (
            <Loading />
          ) : permissionsError === 'REQUEST_ERROR' ? (
            <Error
              title={
                <FormattedMessage
                  id="xpack.fleet.permissionsRequestErrorMessageTitle"
                  defaultMessage="Unable to check permissions"
                />
              }
              error={i18n.translate('xpack.fleet.permissionsRequestErrorMessageDescription', {
                defaultMessage: 'There was a problem checking Fleet permissions',
              })}
            />
          ) : (
            <Panel>
              <EuiEmptyPrompt
                iconType="securityApp"
                title={
                  <h2>
                    {permissionsError === 'MISSING_SUPERUSER_ROLE' ? (
                      <FormattedMessage
                        id="xpack.fleet.permissionDeniedErrorTitle"
                        defaultMessage="Permission denied"
                      />
                    ) : (
                      <FormattedMessage
                        id="xpack.fleet.securityRequiredErrorTitle"
                        defaultMessage="Security is not enabled"
                      />
                    )}
                  </h2>
                }
                body={
                  <p>
                    {permissionsError === 'MISSING_SUPERUSER_ROLE' ? (
                      <FormattedMessage
                        id="xpack.fleet.permissionDeniedErrorMessage"
                        defaultMessage="You are not authorized to access Fleet. Fleet requires {roleName} privileges."
                        values={{ roleName: <EuiCode>superuser</EuiCode> }}
                      />
                    ) : (
                      <FormattedMessage
                        id="xpack.fleet.securityRequiredErrorMessage"
                        defaultMessage="You must enable security in Kibana and Elasticsearch to use Fleet."
                      />
                    )}
                  </p>
                }
              />
            </Panel>
          )}
        </ErrorLayout>
      );
    }

    if (!isInitialized || initializationError) {
      return (
        <ErrorLayout>
          {initializationError ? (
            <Error
              title={
                <FormattedMessage
                  id="xpack.fleet.initializationErrorMessageTitle"
                  defaultMessage="Unable to initialize Fleet"
                />
              }
              error={initializationError}
            />
          ) : (
            <Loading />
          )}
        </ErrorLayout>
      );
    }

    return (
      <EuiErrorBoundary>
        <FleetStatusProvider>
          <IntraAppStateProvider kibanaScopedHistory={history}>
            <Router {...rest}>
              <PackageInstallProvider notifications={notifications}>
                <Switch>
                  <Route path={PAGE_ROUTING_PATHS.integrations}>
                    <DefaultLayout section="epm">
                      <EPMApp />
                    </DefaultLayout>
                  </Route>
                  <Route path={PAGE_ROUTING_PATHS.policies}>
                    <DefaultLayout section="agent_policy">
                      <AgentPolicyApp />
                    </DefaultLayout>
                  </Route>
                  <Route path={PAGE_ROUTING_PATHS.data_streams}>
                    <DefaultLayout section="data_stream">
                      <DataStreamApp />
                    </DefaultLayout>
                  </Route>
                  <ProtectedRoute path={PAGE_ROUTING_PATHS.fleet} isAllowed={agents.enabled}>
                    <DefaultLayout section="fleet">
                      <FleetApp />
                    </DefaultLayout>
                  </ProtectedRoute>
                  <Route exact path={PAGE_ROUTING_PATHS.overview}>
                    <DefaultLayout section="overview">
                      <IngestManagerOverview />
                    </DefaultLayout>
                  </Route>
                  <Redirect to="/" />
                </Switch>
              </PackageInstallProvider>
            </Router>
          </IntraAppStateProvider>
        </FleetStatusProvider>
      </EuiErrorBoundary>
    );
  }
);

const IngestManagerApp = ({
  basepath,
  coreStart,
  setupDeps,
  startDeps,
  config,
  history,
  kibanaVersion,
  extensions,
}: {
  basepath: string;
  coreStart: CoreStart;
  setupDeps: FleetSetupDeps;
  startDeps: FleetStartDeps;
  config: FleetConfigType;
  history: AppMountParameters['history'];
  kibanaVersion: string;
  extensions: UIExtensionsStorage;
}) => {
  const isDarkMode = useObservable<boolean>(coreStart.uiSettings.get$('theme:darkMode'));
  return (
    <coreStart.i18n.Context>
      <KibanaContextProvider services={{ ...coreStart }}>
        <DepsContext.Provider value={{ setup: setupDeps, start: startDeps }}>
          <ConfigContext.Provider value={config}>
            <KibanaVersionContext.Provider value={kibanaVersion}>
              <EuiThemeProvider darkMode={isDarkMode}>
                <UIExtensionsContext.Provider value={extensions}>
                  <IngestManagerRoutes history={history} basepath={basepath} />
                </UIExtensionsContext.Provider>
              </EuiThemeProvider>
            </KibanaVersionContext.Provider>
          </ConfigContext.Provider>
        </DepsContext.Provider>
      </KibanaContextProvider>
    </coreStart.i18n.Context>
  );
};

export function renderApp(
  coreStart: CoreStart,
  { element, appBasePath, history }: AppMountParameters,
  setupDeps: FleetSetupDeps,
  startDeps: FleetStartDeps,
  config: FleetConfigType,
  kibanaVersion: string,
  extensions: UIExtensionsStorage
) {
  ReactDOM.render(
    <IngestManagerApp
      basepath={appBasePath}
      coreStart={coreStart}
      setupDeps={setupDeps}
      startDeps={startDeps}
      config={config}
      history={history}
      kibanaVersion={kibanaVersion}
      extensions={extensions}
    />,
    element
  );

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
}

export const teardownFleet = (coreStart: CoreStart) => {
  coreStart.chrome.docTitle.reset();
  coreStart.chrome.setBreadcrumbs([]);
  licenseService.stop();
};
