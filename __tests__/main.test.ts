/**
 * Unit tests for the action's main functionality, src/main.ts
 */

import * as core from '@actions/core'
import { publish } from 'testbeats'
import { run } from '../src/main'

// Mock the dependencies
jest.mock('@actions/core')
jest.mock('testbeats')
jest.mock('fs/promises')

// Mock inputs
const defaultMockInputs: Record<string, string> = {
  config: '',
  'api-key': '',
  project: '',
  'ci-info': '',
  'chart-test-summary': '',
  run: '',
  slack: '',
  teams: '',
  chat: '',
  title: '',
  junit: '',
  testng: '',
  cucumber: '',
  mocha: '',
  nunit: '',
  xunit: '',
  mstest: ''
}

describe('Github Action Run', () => {
  let mockInputs: Record<string, string>
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks()
    // Create a fresh copy of mockInputs for each test
    mockInputs = { ...defaultMockInputs }
  })

  it('should execute testbeats publish for slack/Junit - only CLI params', async () => {
    mockInputs['slack'] = 'slack_webhook_url'
    mockInputs['junit'] = 'junit_file_path'
    mockInputs['ci-info'] = 'true'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({
      slack: 'slack_webhook_url',
      junit: 'junit_file_path',
      'ci-info': true
    })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should execute testbeats publish for slack/testng - only CLI params', async () => {
    mockInputs['slack'] = 'slack_webhook_url'
    mockInputs['testng'] = 'testng_file_path'
    mockInputs['chart-test-summary'] = 'true'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({
      slack: 'slack_webhook_url',
      testng: 'testng_file_path',
      'chart-test-summary': true
    })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should execute testbeats publish for teams/cucumber - only CLI params', async () => {
    mockInputs['teams'] = 'teams_webhook_url'
    mockInputs['cucumber'] = 'cucumber_file_path'
    mockInputs['chart-test-summary'] = 'true'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({
      teams: 'teams_webhook_url',
      cucumber: 'cucumber_file_path',
      'chart-test-summary': true
    })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should execute testbeats publish for chat/mocha - only CLI params', async () => {
    mockInputs['chat'] = 'chat_webhook_url'
    mockInputs['mocha'] = 'mocha_file_path'
    mockInputs['chart-test-summary'] = 'true'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({
      chat: 'chat_webhook_url',
      mocha: 'mocha_file_path',
      'chart-test-summary': true
    })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should execute testbeats publish for slack/mocha - with api key, project, and run', async () => {
    mockInputs['slack'] = 'slack_webhook_url'
    mockInputs['mocha'] = 'mocha_file_path'
    mockInputs['api-key'] = 'api_key'
    mockInputs['project'] = 'project'
    mockInputs['run'] = 'build_number'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({
      'api-key': 'api_key',
      project: 'project',
      run: 'build_number',
      slack: 'slack_webhook_url',
      mocha: 'mocha_file_path'
    })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should execute testbeats publish for Junit - only config file', async () => {
    mockInputs['config'] = 'config.json'

    jest
      .mocked(core.getInput)
      .mockImplementation((name: string) => mockInputs[name] || '')
    jest
      .mocked(core.getBooleanInput)
      .mockImplementation((name: string) => mockInputs[name] === 'true')
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({ config: 'config.json' })
    expect(core.info).toHaveBeenCalledWith(
      'Successfully published test results'
    )
  })

  it('should handle publish failure', async () => {
    jest.mocked(core.getInput).mockReturnValue('')
    jest.mocked(core.getBooleanInput).mockReturnValue(false)
    jest.mocked(publish).mockRejectedValue(new Error('publish failed'))

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('publish failed')
  })

  it('should handle unexpected errors', async () => {
    jest.mocked(core.getInput).mockReturnValue('')
    jest.mocked(core.getBooleanInput).mockReturnValue(false)
    jest.mocked(publish).mockRejectedValue(new Error('Network error'))

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('Network error')
  })

  it('should handle non-Error objects in catch block', async () => {
    jest.mocked(core.getInput).mockReturnValue('')
    jest.mocked(core.getBooleanInput).mockReturnValue(false)
    jest.mocked(publish).mockRejectedValue('String error')

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('An unexpected error occurred')
  })

  it('should not include empty inputs in opts', async () => {
    jest.mocked(core.getInput).mockReturnValue('')
    jest.mocked(core.getBooleanInput).mockReturnValue(false)
    jest.mocked(publish).mockResolvedValue(undefined)

    await run()

    expect(publish).toHaveBeenCalledWith({})
  })
})
