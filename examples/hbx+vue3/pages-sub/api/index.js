import { getRequest } from '@/lib/base-request'

export function getSubPackageTestApi(params) {
  return getRequest('/sub-package-test', params)
}
