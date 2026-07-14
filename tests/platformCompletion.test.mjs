import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getIndustryBlueprint,
  INDUSTRY_BLUEPRINTS,
  listWizardTemplateOptions,
  WIZARD_INDUSTRIES,
  WIZARD_THEMES,
} from '../lib/platform/industryBlueprint.js';

const PLATFORM_HOSTS = ['dispatch.in', 'acenest.in', 'myshop.in'];

function normalizeDomain(domain) {
  return String(domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
}

describe('industryBlueprint', () => {
  it('exposes wizard industries and themes', () => {
    assert.ok(WIZARD_INDUSTRIES.length >= 6);
    assert.ok(WIZARD_THEMES.some((t) => t.id === 'light'));
  });

  it('defines pages for each industry', () => {
    for (const key of Object.keys(INDUSTRY_BLUEPRINTS)) {
      const bp = getIndustryBlueprint(key);
      assert.ok(bp.pages.length >= 1, `${key} should have pages`);
    }
  });

  it('real-estate includes properties and faq', () => {
    const bp = getIndustryBlueprint('real-estate');
    const slugs = bp.pages.map((p) => p.slug);
    assert.ok(slugs.includes('properties'));
    assert.ok(slugs.includes('faq'));
  });

  it('ecommerce includes product detail page', () => {
    const slugs = getIndustryBlueprint('ecommerce').pages.map((p) => p.slug);
    assert.ok(slugs.includes('product'));
  });

  it('logistics includes tracking', () => {
    const slugs = getIndustryBlueprint('logistics').pages.map((p) => p.slug);
    assert.ok(slugs.includes('tracking'));
  });

  it('listWizardTemplateOptions returns starter pack', () => {
    const opts = listWizardTemplateOptions('saas');
    assert.equal(opts.length, 1);
    assert.ok(opts[0].pageCount >= 4);
  });
});

describe('domain routing helpers', () => {
  it('normalizes domain host', () => {
    assert.equal(normalizeDomain('https://Dispatch.IN/foo'), 'dispatch.in');
  });

  it('recognizes platform hosts', () => {
    assert.ok(PLATFORM_HOSTS.includes('acenest.in'));
    assert.ok(!PLATFORM_HOSTS.includes('example.com'));
  });
});

describe('wizard page definitions use known section keys', () => {
  const KNOWN_SECTIONS = new Set([
    'hero',
    'heroLanding',
    'platformHero',
    'pricing',
    'contactForm',
    'splitHeroCarousel',
    'courierPartners',
    'integrationBenefits',
    'integrationSteps',
    'integrationFeatures',
    'aiCourierRecommendation',
    'businessTypes',
    'faqFullPage',
    'blogFullPage',
    'blogHubHero',
    'blogCategoryTabs',
    'blogFeaturedArticle',
    'blogArticlesGrid',
    'blogGuidesSection',
    'blogNewsletterSection',
    'blogFinalCta',
  ]);

  it('only references catalogued section template keys', () => {
    for (const key of Object.keys(INDUSTRY_BLUEPRINTS)) {
      for (const page of getIndustryBlueprint(key).pages) {
        for (const section of page.sections) {
          assert.ok(
            KNOWN_SECTIONS.has(section),
            `${key}/${page.slug}: unknown section ${section}`
          );
        }
      }
    }
  });
});
