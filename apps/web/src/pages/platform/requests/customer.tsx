/**
 * customer — Re-export shim that redirects the legacy customer-requests route to the pool page.
 *
 * @route /platform/requests/customer
 * @auth Required (agent)
 * @dataSources see pages/platform/pool
 */
export { default } from "@/pages/platform/pool";
