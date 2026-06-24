/**
 * Default `publishedJson` / `draftJson` for new projects.
 * Matches `PublicPageRenderer` sections format.
 */
export function buildDefaultStarterPageJson(projectName = 'Your Website') {
  return {
    sections: [
      {
        id: 'hero_1',
        type: 'hero',
        props: {
          title: projectName,
          subtitle: 'Your new website is ready to customize.',
          buttonText: 'Get Started',
          buttonHref: '#',
        },
        style: {},
      },
      {
        id: 'text_1',
        type: 'text',
        props: {
          heading: 'About this site',
          text: 'Edit this page in the builder admin to publish your brand, services, and contact details.',
        },
        style: {},
      },
    ],
  };
}
