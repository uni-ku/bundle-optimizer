import { getRequest } from '@/lib/base-request'

export function getMainPackageTestApi(params) {
  return getRequest('/main-package-test', params)
}
