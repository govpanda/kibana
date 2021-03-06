/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React, { useMemo, useCallback } from 'react';
import { useRouteMatch, Switch, Route, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiText,
  EuiLink,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
} from '@elastic/eui';
import { Props as EuiTabProps } from '@elastic/eui/src/components/tabs/tab';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import { EuiIconTip } from '@elastic/eui';
import { Agent, AgentPolicy, AgentDetailsReassignPolicyAction } from '../../../types';
import { PAGE_ROUTING_PATHS } from '../../../constants';
import { Loading, Error } from '../../../components';
import {
  useGetOneAgent,
  useGetOneAgentPolicy,
  useLink,
  useBreadcrumbs,
  useCore,
  useKibanaVersion,
} from '../../../hooks';
import { WithHeaderLayout } from '../../../layouts';
import { AgentHealth } from '../components';
import { AgentRefreshContext } from './hooks';
import { AgentEventsTable, AgentDetailsActionMenu, AgentDetailsContent } from './components';
import { useIntraAppState } from '../../../hooks/use_intra_app_state';
import { isAgentUpgradeable } from '../../../services';

const Divider = styled.div`
  width: 0;
  height: 100%;
  border-left: ${(props) => props.theme.eui.euiBorderThin};
`;

export const AgentDetailsPage: React.FunctionComponent = () => {
  const {
    params: { agentId, tabId = '' },
  } = useRouteMatch<{ agentId: string; tabId?: string }>();
  const { getHref } = useLink();
  const kibanaVersion = useKibanaVersion();
  const {
    isLoading,
    isInitialRequest,
    error,
    data: agentData,
    resendRequest: sendAgentRequest,
  } = useGetOneAgent(agentId, {
    pollIntervalMs: 5000,
  });
  const {
    isLoading: isAgentPolicyLoading,
    data: agentPolicyData,
    sendRequest: sendAgentPolicyRequest,
  } = useGetOneAgentPolicy(agentData?.item?.policy_id);

  const {
    application: { navigateToApp },
  } = useCore();
  const routeState = useIntraAppState<AgentDetailsReassignPolicyAction>();
  const queryParams = new URLSearchParams(useLocation().search);
  const openReassignFlyoutOpenByDefault = queryParams.get('openReassignFlyout') === 'true';

  const reassignCancelClickHandler = useCallback(() => {
    if (routeState && routeState.onDoneNavigateTo) {
      navigateToApp(routeState.onDoneNavigateTo[0], routeState.onDoneNavigateTo[1]);
    }
  }, [routeState, navigateToApp]);

  const headerLeftContent = useMemo(
    () => (
      <EuiFlexGroup direction="column" gutterSize="s" alignItems="flexStart">
        <EuiFlexItem>
          <EuiButtonEmpty
            iconType="arrowLeft"
            href={getHref('fleet_agent_list')}
            flush="left"
            size="xs"
          >
            <FormattedMessage
              id="xpack.fleet.agentDetails.viewAgentListTitle"
              defaultMessage="View all agents"
            />
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText>
            <h1>
              {isLoading && isInitialRequest ? (
                <Loading />
              ) : typeof agentData?.item?.local_metadata?.host === 'object' &&
                typeof agentData?.item?.local_metadata?.host?.hostname === 'string' ? (
                agentData.item.local_metadata.host.hostname
              ) : (
                <FormattedMessage
                  id="xpack.fleet.agentDetails.agentDetailsTitle"
                  defaultMessage="Agent '{id}'"
                  values={{
                    id: agentId,
                  }}
                />
              )}
            </h1>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
    [agentData?.item?.local_metadata?.host, agentId, getHref, isInitialRequest, isLoading]
  );

  const headerRightContent = useMemo(
    () =>
      agentData && agentData.item ? (
        <EuiFlexGroup justifyContent={'flexEnd'} direction="row">
          {[
            {
              label: i18n.translate('xpack.fleet.agentDetails.statusLabel', {
                defaultMessage: 'Status',
              }),
              content: <AgentHealth agent={agentData.item} />,
            },
            { isDivider: true },
            {
              label: i18n.translate('xpack.fleet.agentDetails.policyLabel', {
                defaultMessage: 'Policy',
              }),
              content: isAgentPolicyLoading ? (
                <Loading size="m" />
              ) : agentPolicyData?.item ? (
                <EuiLink
                  href={getHref('policy_details', { policyId: agentData.item.policy_id! })}
                  className="eui-textBreakWord"
                >
                  {agentPolicyData.item.name || agentData.item.policy_id}
                </EuiLink>
              ) : (
                agentData.item.policy_id || '-'
              ),
            },
            { isDivider: true },
            {
              label: i18n.translate('xpack.fleet.agentDetails.agentVersionLabel', {
                defaultMessage: 'Agent version',
              }),
              content:
                typeof agentData.item.local_metadata.elastic === 'object' &&
                typeof agentData.item.local_metadata.elastic.agent === 'object' &&
                typeof agentData.item.local_metadata.elastic.agent.version === 'string' ? (
                  <EuiFlexGroup gutterSize="s">
                    <EuiFlexItem grow={false} className="eui-textNoWrap">
                      {agentData.item.local_metadata.elastic.agent.version}
                    </EuiFlexItem>
                    {isAgentUpgradeable(agentData.item, kibanaVersion) ? (
                      <EuiFlexItem grow={false}>
                        <EuiIconTip
                          aria-label={i18n.translate(
                            'xpack.fleet.agentDetails.upgradeAvailableTooltip',
                            {
                              defaultMessage: 'Upgrade available',
                            }
                          )}
                          size="m"
                          type="alert"
                          color="warning"
                          content={i18n.translate(
                            'xpack.fleet.agentDetails.upgradeAvailableTooltip',
                            {
                              defaultMessage: 'Upgrade available',
                            }
                          )}
                        />
                      </EuiFlexItem>
                    ) : null}
                  </EuiFlexGroup>
                ) : (
                  '-'
                ),
            },
            { isDivider: true },
            {
              content: (
                <AgentDetailsActionMenu
                  agent={agentData.item}
                  assignFlyoutOpenByDefault={openReassignFlyoutOpenByDefault}
                  onCancelReassign={
                    routeState && routeState.onDoneNavigateTo
                      ? reassignCancelClickHandler
                      : undefined
                  }
                />
              ),
            },
          ].map((item, index) => (
            <EuiFlexItem grow={false} key={index}>
              {item.isDivider ?? false ? (
                <Divider />
              ) : item.label ? (
                <EuiDescriptionList compressed textStyle="reverse" style={{ textAlign: 'right' }}>
                  <EuiDescriptionListTitle>{item.label}</EuiDescriptionListTitle>
                  <EuiDescriptionListDescription>{item.content}</EuiDescriptionListDescription>
                </EuiDescriptionList>
              ) : (
                item.content
              )}
            </EuiFlexItem>
          ))}
        </EuiFlexGroup>
      ) : undefined,
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    [agentPolicyData, agentData, getHref, isAgentPolicyLoading]
  );

  const headerTabs = useMemo(() => {
    return [
      {
        id: 'activity_log',
        name: i18n.translate('xpack.fleet.agentDetails.subTabs.activityLogTab', {
          defaultMessage: 'Activity log',
        }),
        href: getHref('fleet_agent_details', { agentId, tabId: 'activity' }),
        isSelected: !tabId || tabId === 'activity',
      },
      {
        id: 'details',
        name: i18n.translate('xpack.fleet.agentDetails.subTabs.detailsTab', {
          defaultMessage: 'Agent details',
        }),
        href: getHref('fleet_agent_details', { agentId, tabId: 'details' }),
        isSelected: tabId === 'details',
      },
    ];
  }, [getHref, agentId, tabId]);

  return (
    <AgentRefreshContext.Provider
      value={{
        refresh: () => {
          sendAgentRequest();
          sendAgentPolicyRequest();
        },
      }}
    >
      <WithHeaderLayout
        leftColumn={headerLeftContent}
        rightColumn={headerRightContent}
        tabs={(headerTabs as unknown) as EuiTabProps[]}
      >
        {isLoading && isInitialRequest ? (
          <Loading />
        ) : error ? (
          <Error
            title={
              <FormattedMessage
                id="xpack.fleet.agentDetails.unexceptedErrorTitle"
                defaultMessage="Error loading agent"
              />
            }
            error={error}
          />
        ) : agentData && agentData.item ? (
          <AgentDetailsPageContent agent={agentData.item} agentPolicy={agentPolicyData?.item} />
        ) : (
          <Error
            title={
              <FormattedMessage
                id="xpack.fleet.agentDetails.agentNotFoundErrorTitle"
                defaultMessage="Agent not found"
              />
            }
            error={i18n.translate('xpack.fleet.agentDetails.agentNotFoundErrorDescription', {
              defaultMessage: 'Cannot find agent ID {agentId}',
              values: {
                agentId,
              },
            })}
          />
        )}
      </WithHeaderLayout>
    </AgentRefreshContext.Provider>
  );
};

const AgentDetailsPageContent: React.FunctionComponent<{
  agent: Agent;
  agentPolicy?: AgentPolicy;
}> = ({ agent, agentPolicy }) => {
  useBreadcrumbs('fleet_agent_details', {
    agentHost:
      typeof agent.local_metadata.host === 'object' &&
      typeof agent.local_metadata.host.hostname === 'string'
        ? agent.local_metadata.host.hostname
        : '-',
  });
  return (
    <Switch>
      <Route
        path={PAGE_ROUTING_PATHS.fleet_agent_details_details}
        render={() => {
          return <AgentDetailsContent agent={agent} agentPolicy={agentPolicy} />;
        }}
      />
      <Route
        path={PAGE_ROUTING_PATHS.fleet_agent_details_events}
        render={() => {
          return <AgentEventsTable agent={agent} />;
        }}
      />
    </Switch>
  );
};
