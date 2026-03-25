/* eslint-disable */
/**
 * Generated `api` utility.
 * Run `npx convex dev` to regenerate this file.
 */

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server'
import type * as scans from '../scans.js'
import type * as scanAction from '../scanAction.js'

type Mounts = {
  scans: typeof scans
  scanAction: typeof scanAction
}

export type API = ApiFromModules<Mounts>
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>
declare const fullApi: ApiFromModules<Mounts>
