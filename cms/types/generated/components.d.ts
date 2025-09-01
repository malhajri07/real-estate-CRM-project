import type { Schema, Struct } from '@strapi/strapi';

export interface SharedFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_features';
  info: {
    description: '\u0645\u0643\u0648\u0646 \u0644\u0644\u0645\u064A\u0632\u0627\u062A \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0647\u0628\u0648\u0637';
    displayName: '\u0645\u064A\u0632\u0629';
  };
  attributes: {
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    icon: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedPlanFeature extends Struct.ComponentSchema {
  collectionName: 'components_shared_plan_features';
  info: {
    description: '\u0645\u0643\u0648\u0646 \u0644\u0645\u064A\u0632\u0627\u062A \u062E\u0637\u0637 \u0627\u0644\u062A\u0633\u0639\u064A\u0631';
    displayName: '\u0645\u064A\u0632\u0629 \u0627\u0644\u062E\u0637\u0629';
  };
  attributes: {
    included: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_stats';
  info: {
    description: '\u0645\u0643\u0648\u0646 \u0644\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0641\u064A \u0635\u0641\u062D\u0629 \u0627\u0644\u0647\u0628\u0648\u0637';
    displayName: '\u0625\u062D\u0635\u0627\u0626\u064A\u0629';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    number: Schema.Attribute.String & Schema.Attribute.Required;
    suffix: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.feature': SharedFeature;
      'shared.plan-feature': SharedPlanFeature;
      'shared.stat': SharedStat;
    }
  }
}
