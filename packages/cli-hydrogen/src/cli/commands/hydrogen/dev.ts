import devService from '../../services/dev'
import {hydrogenFlags} from '../../flags'
import {path, cli} from '@shopify/cli-kit'
import {Command, Flags} from '@oclif/core'

export default class Dev extends Command {
  static description = 'Run a Hydrogen storefront locally for development'
  static flags = {
    ...cli.globalFlags,
    path: hydrogenFlags.path,
    force: Flags.boolean({
      description: 'force dependency pre-bundling.',
      env: 'SHOPIFY_FLAG_DEV_FORCE',
    }),
    host: Flags.boolean({
      description: 'listen on all addresses, including LAN and public addresses.',
      env: 'SHOPIFY_FLAG_DEV_HOST',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Dev)
    const directory = flags.path ? path.resolve(flags.path) : process.cwd()

    await devService({directory, ...flags})
  }
}
