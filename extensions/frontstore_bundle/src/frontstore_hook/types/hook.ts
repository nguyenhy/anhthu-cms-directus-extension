import { type defineHook } from "@directus/extensions-sdk";

export type HookConfig = Parameters<typeof defineHook>[0];
export type RegisterFunctions = Parameters<HookConfig>[0];
export type HookExtensionContext = Parameters<HookConfig>[1];
export type ActionHandler = Parameters<RegisterFunctions["action"]>[1];
export type EventContext = Parameters<ActionHandler>[1];
