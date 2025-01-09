import { getRequest } from '@/lib/base-request'

export function getMainPackageTestApi(params?: any) {
  return getRequest('/main-package-test', params)
}
