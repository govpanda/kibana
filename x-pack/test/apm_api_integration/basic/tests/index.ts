/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { FtrProviderContext } from '../../common/ftr_provider_context';

export default function apmApiIntegrationTests({ loadTestFile }: FtrProviderContext) {
  describe('APM specs (basic)', function () {
    this.tags('ciGroup1');

    loadTestFile(require.resolve('./feature_controls'));

    describe('Service Maps', function () {
      loadTestFile(require.resolve('./service_maps/service_maps'));
    });

    describe('Services', function () {
      loadTestFile(require.resolve('./services/annotations'));
      loadTestFile(require.resolve('./services/top_services'));
      loadTestFile(require.resolve('./services/agent_name'));
      loadTestFile(require.resolve('./services/transaction_types'));
    });

    describe('Service overview', function () {
      loadTestFile(require.resolve('./service_overview/error_groups'));
    });

    describe('Settings', function () {
      loadTestFile(require.resolve('./settings/custom_link'));
      loadTestFile(require.resolve('./settings/agent_configuration'));

      describe('Anomaly detection', function () {
        loadTestFile(require.resolve('./settings/anomaly_detection/no_access_user'));
        loadTestFile(require.resolve('./settings/anomaly_detection/read_user'));
        loadTestFile(require.resolve('./settings/anomaly_detection/write_user'));
      });
    });

    describe('Traces', function () {
      loadTestFile(require.resolve('./traces/top_traces'));
    });

    describe('Transaction Group', function () {
      loadTestFile(require.resolve('./transaction_groups/top_transaction_groups'));
      loadTestFile(require.resolve('./transaction_groups/transaction_charts'));
      loadTestFile(require.resolve('./transaction_groups/error_rate'));
      loadTestFile(require.resolve('./transaction_groups/breakdown'));
      loadTestFile(require.resolve('./transaction_groups/distribution'));
    });

    describe('Observability overview', function () {
      loadTestFile(require.resolve('./observability_overview/has_data'));
      loadTestFile(require.resolve('./observability_overview/observability_overview'));
    });

    describe('Metrics', function () {
      loadTestFile(require.resolve('./metrics_charts/metrics_charts'));
    });

    describe('Correlations', function () {
      loadTestFile(require.resolve('./correlations/slow_transactions'));
    });
  });
}
