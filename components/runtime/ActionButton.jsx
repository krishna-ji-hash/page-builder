'use client';

import { useCallback, useState } from 'react';
import {
  executeAction,
  isActionExecutable,
  isSafeNavigateAction,
} from '@/lib/runtime/actionExecutor';
import { useRuntimeData } from './RuntimeProvider';

export default function ActionButton({
  label = 'Button',
  style,
  className,
  action,
  type = 'button',
  disabled: disabledProp = false,
}) {
  const { fetchInternal, bumpRefresh, showToast } = useRuntimeData();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackKind, setFeedbackKind] = useState('info');
  const disabled = Boolean(disabledProp || busy);

  const runtime = {
    fetchInternal,
    bumpRefresh,
    showToast,
  };

  const handleClick = useCallback(async () => {
    if (disabled) return;
    if (!action) return;
    if (isSafeNavigateAction(action)) {
      await executeAction(action, runtime);
      return;
    }
    if (!isActionExecutable(action)) {
      setFeedback('Unsupported or invalid action');
      setFeedbackKind('error');
      return;
    }
    setFeedback('');
    if (action.type === 'showToast' || action.type === 'refreshData' || action.type === 'refreshPage') {
      await executeAction(action, runtime);
      setFeedbackKind('info');
      return;
    }
    setBusy(true);
    try {
      const result = await executeAction(action, runtime);
      if (action.type === 'apiCall' && result?.ok) {
        const successMessage =
          typeof action.successMessage === 'string' && action.successMessage.trim()
            ? action.successMessage.trim()
            : 'Action completed';
        showToast(successMessage, 'success');
        setFeedback(successMessage);
        setFeedbackKind('success');
      } else if (result?.ok && action.type === 'navigate') {
        setFeedback('Navigating...');
        setFeedbackKind('info');
      } else if (!result?.ok) {
        setFeedback(result?.error || 'Action failed');
        setFeedbackKind('error');
      }
    } finally {
      setBusy(false);
    }
  }, [action, disabled, fetchInternal, bumpRefresh, showToast]);

  if (!action) {
    return (
      <button type={type} style={style} className={className} disabled={disabledProp}>
        {label}
      </button>
    );
  }

  return (
    <span className="live-action-button-wrap">
      <button type={type} style={style} className={className} disabled={disabled} onClick={handleClick}>
        {busy ? '…' : label}
      </button>
      {feedback ? (
        <span
          className={`live-action-button__feedback ${feedbackKind === 'success' ? 'live-action-button__feedback--ok' : ''}`.trim()}
          role="status"
        >
          {feedback}
        </span>
      ) : null}
    </span>
  );
}
