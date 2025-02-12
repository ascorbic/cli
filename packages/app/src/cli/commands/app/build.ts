import {appFlags} from '../../flags'
import {App, load as loadApp} from '../../models/app/app'
import build from '../../services/build'
import {Command, Flags} from '@oclif/core'
import {path, cli} from '@shopify/cli-kit'

export default class Build extends Command {
  static description = 'Build the app'

  static flags = {
    ...cli.globalFlags,
    ...appFlags,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'skip-dependencies-installation': Flags.boolean({
      hidden: false,
      description: 'Skips the installation of dependencies.',
      env: 'SHOPIFY_FLAG_SKIP_DEPENDENCIES_INSTALLATION',
      default: false,
    }),
    // eslint-disable-next-line @typescript-eslint/naming-convention
    'api-key': Flags.string({
      hidden: false,
      description: "Application's API key that will be exposed at build time.",
      env: 'SHOPIFY_FLAG_API_KEY',
    }),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Build)
    const directory = flags.path ? path.resolve(flags.path) : process.cwd()
    const app: App = await loadApp(directory)
    await build({app, skipDependenciesInstallation: flags['skip-dependencies-installation'], apiKey: flags['api-key']})
  }
}
