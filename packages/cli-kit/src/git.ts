import {Abort} from './error'
import {hasGit} from './environment/local'
import {content, token, debug} from './output'
import git, {TaskOptions, SimpleGitProgressEvent} from 'simple-git'

export const factory = git

export const GitNotPresentError = () => {
  return new Abort(
    `Git is necessary in the environment to continue`,
    content`Install ${token.link('git', 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git')}`,
  )
}

export async function initializeRepository(directory: string) {
  debug(content`Initializing git repository at ${token.path(directory)}...`)
  await ensurePresentOrAbort()
  await git(directory).init()
}

export async function downloadRepository({
  repoUrl,
  destination,
  progressUpdater,
  shallow,
}: {
  repoUrl: string
  destination: string
  progressUpdater?: (statusString: string) => void
  shallow?: boolean
}) {
  debug(content`Git-cloning repository ${repoUrl} into ${token.path(destination)}...`)
  await ensurePresentOrAbort()
  const [repository, branch] = repoUrl.split('#')
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const options: TaskOptions = {'--recurse-submodules': null}
  if (branch) {
    options['--branch'] = branch
  }
  if (shallow) {
    options['--depth'] = 1
  }
  const progress = ({stage, progress, processed, total}: SimpleGitProgressEvent) => {
    const updateString = `${stage}, ${processed}/${total} objects (${progress}% complete)`
    if (progressUpdater) progressUpdater(updateString)
  }

  await git({progress}).clone(repository, destination, options, (err) => {
    if (err) {
      const abortError = new Abort(err.message)
      abortError.stack = err.stack
      throw abortError
    }
  })
}

/**
 * If "git" is not present in the environment it throws
 * an abort error.
 */
export async function ensurePresentOrAbort() {
  if (!(await hasGit())) {
    throw GitNotPresentError()
  }
}
