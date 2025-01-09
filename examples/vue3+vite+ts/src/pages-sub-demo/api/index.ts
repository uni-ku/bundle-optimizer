import { getRequest } from '@/lib/base-request'

export function getSubPackageTestApi(params: any) {
  return getRequest('/sub-package-test', params)
}
