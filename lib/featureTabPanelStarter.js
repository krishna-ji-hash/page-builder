/**
 * Per-tab panel starter for Feature Tabs "elements" mode — two-column copy | visual (image 2 style).
 */

const desktop = (patch) => ({ desktop: { ...patch } });

const rowMobileStack = {
  mobile: { layout: { flexDirection: 'column', flexWrap: 'wrap' } },
};

const colMobile = {
  mobile: { size: { width: '100%', maxWidth: '100%' } },
};

/**
 * @param {Record<string, unknown> | null | undefined} tab
 * @returns {object[]}
 */
export function buildFeatureTabTwoColumnStarterRoots(tab) {
  const t = tab && typeof tab === 'object' ? tab : {};
  const heading = String(t.heading || 'Tab heading').trim();
  const paragraph = String(t.paragraph || '').trim();
  const bullets = Array.isArray(t.bullets) ? t.bullets.filter(Boolean) : [];
  const imageSrc = String(t.imageSrc || '').trim();
  const imageAlt = String(t.imageAlt || t.label || 'Tab visual').trim();

  /** @type {object[]} */
  const copyStackChildren = [
    {
      nodeType: 'heading',
      displayName: 'Tab heading',
      props: { text: heading },
      style_json: desktop({
        typography: {
          fontSize: 'clamp(22px, 2.4vw, 30px)',
          fontWeight: '800',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
        },
      }),
    },
  ];

  if (paragraph) {
    copyStackChildren.push({
      nodeType: 'text',
      displayName: 'Tab description',
      props: { text: paragraph },
      style_json: desktop({
        typography: { fontSize: '15px', lineHeight: '1.72' },
      }),
    });
  }

  copyStackChildren.push({
    nodeType: 'counter_block',
    displayName: 'Key stat',
    props: {
      value: '98',
      prefix: '',
      suffix: '%',
      label: 'Successful Pickup Rate',
      description: '',
    },
    style_json: desktop({
      layout: { width: '100%' },
      colors: { textColor: '#2563eb' },
      typography: { fontSize: '48px', fontWeight: '800', lineHeight: '1.1' },
      spacing: { marginTop: '4px', marginBottom: '4px' },
    }),
  });

  bullets.forEach((line, i) => {
    copyStackChildren.push({
      nodeType: 'text',
      displayName: `Bullet ${i + 1}`,
      props: { text: String(line).startsWith('•') ? line : `• ${line}` },
      style_json: desktop({
        typography: { fontSize: '15px', lineHeight: '1.55' },
      }),
    });
  });

  copyStackChildren.push({
    nodeType: 'button',
    displayName: 'Learn more',
    props: { text: 'Learn more', href: '#' },
    style_json: desktop({
      spacing: { padding: '10px 22px', marginTop: '8px' },
      typography: { fontSize: '14px', fontWeight: '700' },
      border: { radius: '999px', width: '1px', color: '#2563eb' },
      colors: { textColor: '#2563eb', backgroundColor: 'transparent' },
    }),
  });

  /** @type {object[]} */
  const visualChildren = imageSrc
    ? [
        {
          nodeType: 'image',
          displayName: 'Tab visual',
          props: { src: imageSrc, alt: imageAlt },
          style_json: desktop({
            layout: { width: '100%' },
            border: { radius: '16px' },
          }),
        },
      ]
    : [
        {
          nodeType: 'text',
          displayName: 'Visual placeholder',
          props: {
            text: 'Right column: add Image, Card, or Advanced widgets (zipcode check, carrier cards, diagrams).',
          },
          style_json: desktop({
            typography: { fontSize: '14px', lineHeight: '1.5', textAlign: 'center' },
          }),
        },
      ];

  return [
    {
      nodeType: 'row',
      displayName: 'Tab panel layout',
      style_json: {
        ...rowMobileStack,
        desktop: {
          layout: {
            gap: 32,
            alignItems: 'stretch',
            flexWrap: 'nowrap',
            justifyContent: 'space-between',
          },
          spacing: { padding: '8px 0 0' },
        },
      },
      children: [
        {
          nodeType: 'column',
          displayName: 'Copy column',
          style_json: {
            ...colMobile,
            desktop: {
              layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
              size: { width: 'auto', maxWidth: '56%' },
            },
          },
          children: [
            {
              nodeType: 'stack',
              displayName: 'Copy stack',
              style_json: desktop({
                layout: { flexDirection: 'column', gap: 16, alignItems: 'flex-start' },
              }),
              children: copyStackChildren,
            },
          ],
        },
        {
          nodeType: 'column',
          displayName: 'Visual column',
          style_json: {
            ...colMobile,
            desktop: {
              layout: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
              size: { width: 'auto', maxWidth: '44%' },
            },
          },
          children: [
            {
              nodeType: 'stack',
              displayName: 'Visual stack',
              style_json: desktop({
                layout: {
                  flexDirection: 'column',
                  gap: 12,
                  alignItems: 'stretch',
                  width: '100%',
                },
              }),
              children: visualChildren,
            },
          ],
        },
      ],
    },
  ];
}

/**
 * @param {object[]} templateRoots
 * @param {number|string} parentNodeId
 * @param {(payload: object) => Promise<{ id?: number }>} createNodeRequest
 */
export async function materializeTemplateUnderParent(templateRoots, parentNodeId, createNodeRequest) {
  if (!Array.isArray(templateRoots) || !templateRoots.length) return;

  async function createRecursive(templateNode, parentId, childIndex) {
    const created = await createNodeRequest({
      nodeType: templateNode.nodeType,
      parentNodeId: parentId,
      displayName: templateNode.displayName || templateNode.nodeType,
      props: templateNode.props,
      style_json: templateNode.style_json,
      positionIndex: childIndex,
    });
    const id = created?.id;
    if (!id) throw new Error(`Failed to create node: ${templateNode.nodeType}`);
    const kids = templateNode.children || [];
    for (let i = 0; i < kids.length; i += 1) {
      await createRecursive(kids[i], id, i);
    }
    return id;
  }

  for (let r = 0; r < templateRoots.length; r += 1) {
    await createRecursive(templateRoots[r], parentNodeId, r);
  }
}
