import type { CSSProperties, ReactNode } from 'react';
import '@/styles/shared/public-page-fallback.css';

type SectionRecord = {
  id?: string;
  type?: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
};

export type { SectionRecord };

const isDev = process.env.NODE_ENV === 'development';

function asString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

function styleFromSection(section: SectionRecord): CSSProperties {
  const style = section.style;
  if (!style || typeof style !== 'object' || Array.isArray(style)) return {};
  return style as CSSProperties;
}

function HeroSection({ section }: { section: SectionRecord }) {
  const props = section.props ?? {};
  const title = asString(props.title, asString(props.heading, 'Welcome'));
  const subtitle = asString(props.subtitle, asString(props.subheading, asString(props.body, '')));
  const buttonText = asString(props.buttonText, asString(props.ctaText, ''));
  const buttonHref = asString(props.buttonHref, asString(props.href, '#'));

  return (
    <section className="pub-page__section pub-page__hero" style={styleFromSection(section)}>
      <div className="pub-page__container pub-page__hero-inner">
        <h1 className="pub-page__hero-title">{title}</h1>
        {subtitle ? <p className="pub-page__hero-subtitle">{subtitle}</p> : null}
        {buttonText ? (
          <a className="pub-page__hero-button" href={buttonHref}>
            {buttonText}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function TextSection({ section }: { section: SectionRecord }) {
  const props = section.props ?? {};
  const text = asString(
    props.text,
    asString(props.body, asString(props.content, asString(props.paragraph, '')))
  );
  const heading = asString(props.heading, asString(props.title, ''));

  return (
    <section className="pub-page__section pub-page__text" style={styleFromSection(section)}>
      <div className="pub-page__container pub-page__text-inner">
        {heading ? <h2 className="pub-page__text-heading">{heading}</h2> : null}
        {text ? <p className="pub-page__text-body">{text}</p> : null}
      </div>
    </section>
  );
}

function ImageSection({ section }: { section: SectionRecord }) {
  const props = section.props ?? {};
  const src = asString(props.src, asString(props.url, asString(props.image, '')));
  const alt = asString(props.alt, asString(props.caption, ''));
  const caption = asString(props.caption, '');

  if (!src) {
    if (!isDev) return null;
    return (
      <section className="pub-page__section pub-page__image" style={styleFromSection(section)}>
        <div className="pub-page__container">
          <div className="pub-page__unsupported">Image section missing `src`</div>
        </div>
      </section>
    );
  }

  return (
    <section className="pub-page__section pub-page__image" style={styleFromSection(section)}>
      <div className="pub-page__container pub-page__image-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pub-page__image-el" src={src} alt={alt} loading="lazy" />
        {caption ? <figcaption className="pub-page__image-caption">{caption}</figcaption> : null}
      </div>
    </section>
  );
}

function UnsupportedSection({ section }: { section: SectionRecord }) {
  if (!isDev) return null;
  const typeName = asString(section.type, 'unknown');
  return (
    <section className="pub-page__section pub-page__unsupported-wrap" style={styleFromSection(section)}>
      <div className="pub-page__container">
        <div className="pub-page__unsupported">
          Unsupported section type: <code>{typeName}</code>
        </div>
      </div>
    </section>
  );
}

function renderSection(section: SectionRecord, index: number): ReactNode {
  const key = asString(section.id, `section-${index}`);
  const type = asString(section.type, '').toLowerCase();

  switch (type) {
    case 'hero':
      return <HeroSection key={key} section={section} />;
    case 'text':
    case 'paragraph':
    case 'copy':
      return <TextSection key={key} section={section} />;
    case 'image':
    case 'img':
      return <ImageSection key={key} section={section} />;
    default:
      return <UnsupportedSection key={key} section={section} />;
  }
}

type PublicPageSectionsFallbackProps = {
  sections: SectionRecord[];
  project?: Record<string, unknown> | null;
  page?: Record<string, unknown> | null;
  variant?: 'sections' | 'blocks';
};

/** Fallback renderer for `content.sections` (starter JSON, simple pages). */
export default function PublicPageSectionsFallback({
  sections,
  project = null,
  page = null,
  variant = 'sections',
}: PublicPageSectionsFallbackProps) {
  const projectName = asString(project?.name, asString(project?.title, ''));
  const pageTitle = asString(page?.title, asString(page?.name, ''));

  if (!sections.length) {
    return (
      <article
        className="pub-page"
        data-project={projectName || undefined}
        data-page={pageTitle || undefined}
        data-pub-variant={variant}
      >
        <div className="pub-page__empty">
          <p>No published {variant} to display.</p>
          {isDev ? (
            <p className="pub-page__empty-hint">
              Expected <code>publishedJson.{variant}</code> array.
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <article
      className="pub-page"
      data-project={projectName || undefined}
      data-page={pageTitle || undefined}
      data-pub-variant={variant}
    >
      {sections.map(renderSection)}
    </article>
  );
}
