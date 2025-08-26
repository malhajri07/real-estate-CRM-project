/**
 * pricing-plan controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::pricing-plan.pricing-plan', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;

    const entities = await strapi.entityService.findMany('api::pricing-plan.pricing-plan', {
      ...query,
      populate: {
        features: true,
      },
      sort: { order: 'asc' },
    });

    const sanitizedEntities = await this.sanitizeOutput(entities, ctx);
    return this.transformResponse(sanitizedEntities);
  },
}));