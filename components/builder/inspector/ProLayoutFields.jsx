'use client';

import { InspectorField } from './InspectorUi';
import { InspectorNumInput, inspectorNumStringChange } from '@/components/builder/inspector/InspectorNumeric';

const DISPLAY_OPTIONS = ['block', 'flex', 'inline', 'inline-block', 'inline-flex', 'grid', 'none'];
const OVERFLOW_OPTIONS = ['visible', 'hidden', 'auto', 'scroll'];
const POSITION_OPTIONS = ['static', 'relative', 'absolute', 'fixed', 'sticky'];

export default function ProLayoutFields({ form, onUpdate, onResetLayoutKeys, disabled }) {
  const reset = (keys) => () => onResetLayoutKeys?.(keys);

  return (
    <>
      <InspectorField label="Display" keywords="display block flex grid" resetKey="display" onReset={reset(['display'])} disabled={disabled}>
        <select className="bld-input" value={form.layoutDisplay || ''} disabled={disabled} onChange={(e) => onUpdate('layoutDisplay', e.target.value)}>
          <option value="">Default</option>
          {DISPLAY_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </InspectorField>

      <div className="bld-field-grid">
        <InspectorField label="Overflow" keywords="overflow scroll hidden" resetKey="overflow" onReset={reset(['overflow'])} disabled={disabled}>
          <select className="bld-input" value={form.layoutOverflow || ''} disabled={disabled} onChange={(e) => onUpdate('layoutOverflow', e.target.value)}>
            <option value="">Default</option>
            {OVERFLOW_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </InspectorField>
        <InspectorField label="Z-index" keywords="z-index stack order" resetKey="zIndex" onReset={reset(['zIndex'])} disabled={disabled}>
          <input
            className="bld-input"
            value={form.zIndex ?? ''}
            disabled={disabled}
            placeholder="auto"
            onChange={(e) => onUpdate('zIndex', e.target.value)}
          />
        </InspectorField>
      </div>

      <InspectorField label="Position" keywords="position absolute fixed sticky" resetKey="position" onReset={reset(['position', 'top', 'right', 'bottom', 'left'])} disabled={disabled}>
        <select className="bld-input" value={form.position || 'static'} disabled={disabled} onChange={(e) => onUpdate('position', e.target.value)}>
          {POSITION_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </InspectorField>

      {form.position && form.position !== 'static' ? (
        <div className="bld-field-grid">
          {['left', 'top', 'right', 'bottom'].map((side) => (
            <div key={side} className="bld-field">
              <label className="bld-label">{side}</label>
              <input
                className="bld-input"
                value={form[side] ?? ''}
                disabled={disabled}
                placeholder="auto"
                onChange={(e) => onUpdate(side, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="bld-field-grid">
        <InspectorField label="Align self" keywords="align-self flex child" resetKey="alignSelf" onReset={reset(['alignSelf'])} disabled={disabled}>
          <select className="bld-input" value={form.layoutAlignSelf || ''} disabled={disabled} onChange={(e) => onUpdate('layoutAlignSelf', e.target.value)}>
            <option value="">Default</option>
            <option value="auto">auto</option>
            <option value="stretch">stretch</option>
            <option value="flex-start">flex-start</option>
            <option value="center">center</option>
            <option value="flex-end">flex-end</option>
          </select>
        </InspectorField>
        <InspectorField label="Order" keywords="flex order" resetKey="order" onReset={reset(['order'])} disabled={disabled}>
          <InspectorNumInput
            min={-99}
            max={99}
            value={form.layoutOrder ?? ''}
            disabled={disabled}
            onChange={inspectorNumStringChange(onUpdate, 'layoutOrder')}
          />
        </InspectorField>
      </div>

      <div className="bld-field-grid">
        <InspectorField label="Flex grow" keywords="flex grow" resetKey="flexGrow" onReset={reset(['flexGrow', 'flex'])} disabled={disabled}>
          <input className="bld-input" value={form.layoutFlexGrow ?? ''} disabled={disabled} onChange={(e) => onUpdate('layoutFlexGrow', e.target.value)} />
        </InspectorField>
        <InspectorField label="Flex shrink" keywords="flex shrink" resetKey="flexShrink" onReset={reset(['flexShrink', 'flex'])} disabled={disabled}>
          <input className="bld-input" value={form.layoutFlexShrink ?? ''} disabled={disabled} onChange={(e) => onUpdate('layoutFlexShrink', e.target.value)} />
        </InspectorField>
        <InspectorField label="Flex basis" keywords="flex basis" resetKey="flexBasis" onReset={reset(['flexBasis', 'flex'])} disabled={disabled}>
          <input className="bld-input" value={form.layoutFlexBasis ?? ''} disabled={disabled} placeholder="auto" onChange={(e) => onUpdate('layoutFlexBasis', e.target.value)} />
        </InspectorField>
      </div>
    </>
  );
}
