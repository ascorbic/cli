import {HydrogenApp} from '../models/hydrogen'
import {genericConfigurationFileNames} from '../constants'
import {ui, vscode, npm, file, dependency, path, error} from '@shopify/cli-kit'
import stream from 'node:stream'

interface AddESlintOptions {
  app: HydrogenApp
  force: boolean
  install: boolean
}

export async function addESLint({app, force, install}: AddESlintOptions) {
  const list = new ui.Listr([
    {
      title: 'Installing additional dependencies',
      skip: () => !install,
      task: async (_, task) => {
        const requiredDependencies = ['eslint', 'eslint-plugin-hydrogen', 'prettier', '@shopify/prettier-config']
        await dependency.addNPMDependenciesWithoutVersionIfNeeded(requiredDependencies, {
          dependencyManager: app.dependencyManager,
          type: 'prod',
          directory: app.directory,
          stderr: new stream.Writable({
            write(chunk, encoding, next) {
              task.output = chunk.toString()
              next()
            },
          }),
          stdout: new stream.Writable({
            write(chunk, encoding, next) {
              task.output = chunk.toString()
              next()
            },
          }),
        })
        task.title = 'Dependencies installed'
      },
    },

    {
      title: 'Adding ESLint configuration',
      task: async (_, task) => {
        const eslintConfigPath = path.join(app.directory, genericConfigurationFileNames.eslint)

        if (await file.exists(eslintConfigPath)) {
          if (force) {
            await file.remove(eslintConfigPath)
          } else {
            throw new error.Abort('ESLint config already exists.', 'Use --force to override existing config.')
          }
        }

        const eslintConfig = await file.format(
          ['module.exports = {', 'extends: [', `'plugin:hydrogen/recommended'`, ' ],', ' };'].join('\n'),
          {path: genericConfigurationFileNames.eslint},
        )

        await file.write(eslintConfigPath, eslintConfig)

        task.title = 'ESLint configuration added'
      },
    },
    {
      title: 'Updating package.json',
      task: async (_, task) => {
        const packageJSON = await npm.readPackageJSON(app.directory)

        packageJSON.scripts.lint = `eslint --ext .js,.ts,.jsx,.tsx src/`

        packageJSON.prettier = '@shopify/prettier-config'

        await npm.writePackageJSON(app.directory, packageJSON)

        task.title = 'Package.json updated'
      },
    },
    {
      title: 'Adding editor plugin recommendations',
      skip: async () => !(await vscode.isVSCode(app.directory)),
      task: async (_, task) => {
        await vscode.addRecommendedExtensions(app.directory, ['dbaeumer.vscode-eslint'])
        task.title = 'Editor plugin recommendations added'
      },
    },
  ])
  await list.run()
}
