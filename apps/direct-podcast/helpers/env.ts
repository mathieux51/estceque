import { EnvError } from '../helpers/errors'

const getEnv = () => {
  const env = {}
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      throw new EnvError(`${key} is required`)
    }
  }
  return env
}

export default getEnv()
