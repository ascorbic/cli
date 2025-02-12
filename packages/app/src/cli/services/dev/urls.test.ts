import {updateURLs, generateURL} from './urls'
import {App, WebType} from '../../models/app/app'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {api, error} from '@shopify/cli-kit'
import {Plugin} from '@oclif/core/lib/interfaces'

const LOCAL_APP: App = {
  name: 'my-app',
  idEnvironmentVariableName: 'SHOPIFY_API_KEY',
  directory: '',
  dependencyManager: 'yarn',
  configurationPath: '/shopify.app.toml',
  configuration: {scopes: 'read_products'},
  webs: [
    {
      directory: '',
      configuration: {
        type: WebType.Backend,
        commands: {dev: ''},
      },
    },
  ],
  nodeDependencies: {},
  extensions: {ui: [], theme: [], function: []},
}

beforeEach(() => {
  vi.mock('@shopify/cli-kit', async () => {
    const cliKit: any = await vi.importActual('@shopify/cli-kit')
    return {
      ...cliKit,
      session: {
        ensureAuthenticatedPartners: async () => 'token',
      },
      api: {
        partners: {
          request: vi.fn(),
        },
        graphql: cliKit.api.graphql,
      },
      plugins: {
        lookupTunnelPlugin: async () => {
          return {start: async () => 'https://fake-url.ngrok.io'}
        },
      },
    }
  })
})

describe('generateURL', () => {
  it('returns a tunnel URL by default', async () => {
    // Given
    const pluginList: Plugin[] = []
    // When

    const got = await generateURL(pluginList, 3456)

    // Then
    expect(got).toEqual('https://fake-url.ngrok.io')
  })
})

describe('updateURLs', () => {
  it('sends a request to update the URLs', async () => {
    // Given
    vi.mocked(api.partners.request).mockResolvedValueOnce({appUpdate: {userErrors: []}})
    const expectedVariables = {
      apiKey: 'apiKey',
      appUrl: 'http://localhost:3456',
      redir: [
        'http://localhost:3456/auth/callback',
        'http://localhost:3456/auth/shopify/callback',
        'http://localhost:3456/api/auth/callback',
      ],
    }

    // When
    await updateURLs('apiKey', 'http://localhost:3456')

    // Then
    expect(api.partners.request).toHaveBeenCalledWith(api.graphql.UpdateURLsQuery, 'token', expectedVariables)
  })

  it('throws an error if requests has a user error', async () => {
    // Given
    vi.mocked(api.partners.request).mockResolvedValueOnce({appUpdate: {userErrors: [{message: 'Boom!'}]}})

    // When
    const got = updateURLs('apiKey', 'http://localhost:3456')

    // Then
    expect(got).rejects.toThrow(new error.Abort(`Boom!`))
  })
})
