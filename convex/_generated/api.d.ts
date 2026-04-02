/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as alerts from "../alerts.js";
import type * as checks_accessibility from "../checks/accessibility.js";
import type * as checks_dns from "../checks/dns.js";
import type * as checks_performance from "../checks/performance.js";
import type * as checks_security from "../checks/security.js";
import type * as checks_seo from "../checks/seo.js";
import type * as checks_trust from "../checks/trust.js";
import type * as checks_types from "../checks/types.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as monitors from "../monitors.js";
import type * as scanAction from "../scanAction.js";
import type * as scans from "../scans.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  "checks/accessibility": typeof checks_accessibility;
  "checks/dns": typeof checks_dns;
  "checks/performance": typeof checks_performance;
  "checks/security": typeof checks_security;
  "checks/seo": typeof checks_seo;
  "checks/trust": typeof checks_trust;
  "checks/types": typeof checks_types;
  crons: typeof crons;
  http: typeof http;
  monitors: typeof monitors;
  scanAction: typeof scanAction;
  scans: typeof scans;
  stripe: typeof stripe;
  users: typeof users;
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
