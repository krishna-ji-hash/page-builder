/**
 * Async scaffold for {@link resolveEditableInsertTarget} — uses createNodeRequest only.
 * @param {import('./resolveEditableInsertTarget.js').ResolveInsertTargetOk} target
 * @param {(payload: object) => Promise<object|null>} createNodeRequest
 */
export async function fulfillInsertTarget(target, createNodeRequest) {
  let parentId = target.parentId ?? null;
  let insertIndex =
    Number.isInteger(target.insertIndex) && target.insertIndex >= 0 ? target.insertIndex : undefined;

  if (!target.createMissingColumn && !target.createMissingStack) {
    if (parentId == null) {
      throw new Error('Could not resolve a Stack to add this element.');
    }
    return { parentId, insertIndex };
  }

  if (target.createMissingColumn && target.rowParentId != null) {
    const column = await createNodeRequest({
      nodeType: 'column',
      parentNodeId: target.rowParentId,
      displayName: 'Column',
      positionIndex: target.insertIndex ?? 0,
    });
    if (!column?.id) throw new Error('Failed to create column for new element.');
    target = {
      ...target,
      createMissingColumn: false,
      createMissingStack: true,
      stackParentId: column.id,
      insertIndex: 0,
    };
  }

  if (target.createMissingStack && target.stackParentId != null) {
    const stack = await createNodeRequest({
      nodeType: 'stack',
      parentNodeId: target.stackParentId,
      displayName: 'Stack',
      positionIndex: target.insertIndex ?? 0,
    });
    if (!stack?.id) throw new Error('Failed to create stack for new element.');
    parentId = stack.id;
    insertIndex = 0;
  }

  if (parentId == null) {
    throw new Error('Could not resolve a Stack to add this element.');
  }

  return { parentId, insertIndex };
}
