/**
 * landing-page controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::landing-page.landing-page', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;

    const entity = await strapi.entityService.findMany('api::landing-page.landing-page', {
      ...query,
      populate: {
        features: true,
        stats: true,
      },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));