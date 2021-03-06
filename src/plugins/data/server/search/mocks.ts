/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import type { RequestHandlerContext } from 'src/core/server';
import { coreMock } from '../../../../core/server/mocks';
import { ISearchSetup, ISearchStart } from './types';
import { searchAggsSetupMock, searchAggsStartMock } from './aggs/mocks';
import { searchSourceMock } from './search_source/mocks';

export function createSearchSetupMock(): jest.Mocked<ISearchSetup> {
  return {
    aggs: searchAggsSetupMock(),
    registerSearchStrategy: jest.fn(),
    __enhance: jest.fn(),
  };
}

export function createSearchStartMock(): jest.Mocked<ISearchStart> {
  return {
    aggs: searchAggsStartMock(),
    getSearchStrategy: jest.fn(),
    asScoped: jest.fn().mockReturnValue({
      search: jest.fn(),
      cancel: jest.fn(),
    }),
    searchSource: searchSourceMock.createStartContract(),
  };
}

export function createSearchRequestHandlerContext(): jest.Mocked<RequestHandlerContext> {
  return {
    core: coreMock.createRequestHandlerContext(),
    search: {
      search: jest.fn(),
      cancel: jest.fn(),
      session: {
        save: jest.fn(),
        get: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        trackId: jest.fn(),
        getId: jest.fn(),
      },
    },
  };
}
