import * as core from '@actions/core'
import { exec } from '@actions/exec'
import fs from 'fs'
import axios, { isAxiosError } from 'axios'

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
    // Get config file input
    const configFile = core.getInput('config')

    // Build command arguments array
    const args: string[] = []

    // Handle config file
    if (configFile) {
      args.push('--config', configFile)
    }

    // Define input keys
    const inputs = [
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

    // Add other inputs if they exist
    for (const input of inputs) {
      const value = core.getInput(input)
      if (value) {
        args.push(`--${input}`, value)
      }
    }

    // Add boolean flags
    if (core.getBooleanInput('ci-info')) args.push('--ci-info')
    if (core.getBooleanInput('chart-test-summary'))
      args.push('--chart-test-summary')

    // Execute testbeats CLI command
    const exitCode = await exec('npx', ['testbeats', 'publish', ...args])

    if (exitCode !== 0) {
      throw new Error(`testbeats CLI command failed with exit code ${exitCode}`)
    }

    core.info('Successfully published test results')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}
