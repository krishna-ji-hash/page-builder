/**
 * Default published/draft page tree for `main-site` seed.
 * Matches database/seeds/001_sample_builder.sql hero layout.
 */
export const DEFAULT_BUILDER_PAGE_JSON = {
  nodes: [
    {
      id: 'seed-row-1',
      nodeType: 'row',
      displayName: 'Hero Row',
      positionIndex: 0,
      props: { gap: 16, style_json: {} },
      children: [
        {
          id: 'seed-col-1',
          nodeType: 'column',
          displayName: 'Main Column',
          positionIndex: 0,
          props: { width: '100%', style_json: {} },
          children: [
            {
              id: 'seed-stack-1',
              nodeType: 'stack',
              displayName: 'Hero Stack',
              positionIndex: 0,
              props: { direction: 'vertical', gap: 12, style_json: {} },
              children: [
                {
                  id: 'seed-heading-1',
                  nodeType: 'heading',
                  displayName: 'Hero Heading',
                  positionIndex: 0,
                  props: {
                    text: 'Build Faster With Your Own Platform',
                    tag: 'h1',
                    style_json: {},
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
} as const;
