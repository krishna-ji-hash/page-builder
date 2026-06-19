'use client';

import { SEO_SCHEMA_TYPES } from '@/lib/seo/seoConstants';
import { SCHEMA_FIELD_DEFS, buildSchemaTemplateFromFields, defaultSchemaFieldValues } from '@/lib/seo/schemaFieldDefs';
import { SeoField } from './shared';

export default function SchemaTab({ form, setForm, schemaText, setSchemaText, schemaError, setSchemaError, useStructuredBuilder, setUseStructuredBuilder }) {
  const schemaType = form.schemaType || '';
  const fieldDefs = SCHEMA_FIELD_DEFS[schemaType] || [];
  const fieldValues = form.schemaFieldValues || {};

  const onTypeChange = (type) => {
    setForm((p) => ({
      ...p,
      schemaType: type,
      schemaFieldValues: defaultSchemaFieldValues(type),
    }));
    if (useStructuredBuilder && type) {
      const tpl = buildSchemaTemplateFromFields(type, defaultSchemaFieldValues(type));
      setSchemaText(tpl ? JSON.stringify(tpl, null, 2) : '');
      setSchemaError('');
    }
  };

  const onFieldChange = (key, value) => {
    setForm((p) => {
      const nextValues = { ...(p.schemaFieldValues || {}), [key]: value };
      if (useStructuredBuilder && schemaType) {
        const tpl = buildSchemaTemplateFromFields(schemaType, nextValues);
        setSchemaText(tpl ? JSON.stringify(tpl, null, 2) : '');
      }
      return { ...p, schemaFieldValues: nextValues };
    });
  };

  return (
    <div className="bld-seo-modal__section">
      <SeoField label="Schema type" full>
        <select className="bld-input" value={schemaType} onChange={(e) => onTypeChange(e.target.value)}>
          <option value="">None / auto</option>
          {SEO_SCHEMA_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </SeoField>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <input type="checkbox" checked={useStructuredBuilder} onChange={(e) => setUseStructuredBuilder(e.target.checked)} />
        Use structured field builder (updates JSON-LD below)
      </label>

      {schemaType && fieldDefs.length ? (
        <div className="bld-seo-modal__schema-fields">
          {fieldDefs.map((def) => (
            <SeoField key={def.key} label={def.label} hint={`Token: ${def.token}`}>
              <input
                className="bld-input"
                value={fieldValues[def.key] ?? def.token}
                onChange={(e) => onFieldChange(def.key, e.target.value)}
              />
            </SeoField>
          ))}
        </div>
      ) : null}

      <div>
        <h3 className="bld-seo-modal__section-title">Advanced JSON-LD</h3>
        <p className="bld-field-note">
          Tokens: {'{{title}}'}, {'{{description}}'}, {'{{url}}'}, {'{{siteTitle}}'}, {'{{image}}'}, {'{{item.title}}'}, {'{{item.data.*}}'}
        </p>
        <textarea
          className="bld-input bld-seo-modal__json"
          rows={10}
          value={schemaText}
          onChange={(e) => {
            setSchemaText(e.target.value);
            setSchemaError('');
          }}
          placeholder='{"@context":"https://schema.org","@type":"WebPage","name":"{{title}}"}'
        />
        {schemaError ? <p className="bld-field-error">{schemaError}</p> : null}
      </div>
    </div>
  );
}
