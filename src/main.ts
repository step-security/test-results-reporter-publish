import * as core from '@actions/core'
import fs from 'fs'
import axios, { isAxiosError } from 'axios'
import { publish } from 'testbeats'

declare module 'testbeats' {
  export function publish(opts: Record<string, unknown>): Promise<void>
}

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8')) as {
      repository?: { private?: boolean }
    }
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'test-results-reporter/publish'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('\u001b[1;36mStepSecurity Maintained Action\u001b[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('\u001b[32m✓ Free for public repositories\u001b[0m')
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = { action: action || '' }
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 }
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`
      )
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

export async function run(): Promise<void> {
  try {
    await validateSubscription()
    const opts: Record<string, unknown> = {}

    const configFile = core.getInput('config')
    if (configFile) opts['config'] = configFile

    const stringInputs = [
      'api-key',
      'project',
      'run',
      'slack',
      'teams',
      'chat',
      'title',
      'junit',
      'testng',
      'cucumber',
      'mocha',
      'nunit',
      'xunit',
      'mstest'
    ] as const

    for (const input of stringInputs) {
      const value = core.getInput(input)
      if (value) opts[input] = value
    }

    if (core.getBooleanInput('ci-info')) opts['ci-info'] = true
    if (core.getBooleanInput('chart-test-summary'))
      opts['chart-test-summary'] = true

    await publish(opts)

    core.info('Successfully published test results')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}
