/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiTools from "../aiTools.js";
import type * as aiUsage from "../aiUsage.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as monitoring from "../monitoring.js";
import type * as scanMutations from "../scanMutations.js";
import type * as scanQueries from "../scanQueries.js";
import type * as scans from "../scans.js";
import type * as users from "../users.js";
import type * as watchedSites from "../watchedSites.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiTools: typeof aiTools;
  aiUsage: typeof aiUsage;
  crons: typeof crons;
  http: typeof http;
  monitoring: typeof monitoring;
  scanMutations: typeof scanMutations;
  scanQueries: typeof scanQueries;
  scans: typeof scans;
  users: typeof users;
  watchedSites: typeof watchedSites;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
