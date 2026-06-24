const { resolveAll, mergeDefaults, DEFAULT_LABELS, MINIMAL_LABELS } = require('../src/render-config');

describe('render-config', () => {
  test('mergeDefaults: inline beats file beats built-in', () => {
    const merged = mergeDefaults(
      {
        defaults: {
          date_format: 'absolute',
          status_labels: { merged: 'merged!', open: 'open!' }
        }
      },
      {
        date_format: 'both',
        status_labels: { open: 'OPEN' }
      }
    );
    expect(merged.date_format).toBe('both');
    expect(merged.status_labels.merged).toBe('merged!');
    expect(merged.status_labels.open).toBe('OPEN');
    expect(merged.status_labels.closed).toBe(DEFAULT_LABELS.closed);
  });

  test('mergeDefaults: unknown date_format falls through to file then default', () => {
    const merged = mergeDefaults(
      { defaults: { date_format: 'absolute' } },
      { date_format: 'bogus' }
    );
    expect(merged.date_format).toBe('absolute');
  });

  test('resolveAll: file sets style, inline overrides', () => {
    const meta = {
      open_prs: {
        defaultStyle: 'table',
        defaultColumns: ['pr', 'ref'],
        availableColumns: { pr: {}, ref: {}, state: {} },
        defaultEmptyState: 'none'
      }
    };
    const resolved = resolveAll({
      fileConfig: { sections: { open_prs: { style: 'list', columns: ['pr'] } } },
      inline: { sections: { open_prs: { style: 'compact' } } },
      sectionMeta: meta,
      sectionNames: ['open_prs']
    });
    expect(resolved.sections.open_prs.style).toBe('compact');
    expect(resolved.sections.open_prs.columns).toEqual(['pr']);
  });

  test('resolveAll: invalid style falls back to default', () => {
    const resolved = resolveAll({
      fileConfig: {},
      inline: { sections: { open_prs: { style: 'rainbow' } } },
      sectionMeta: { open_prs: { defaultStyle: 'table', defaultColumns: ['pr'], availableColumns: { pr: {} } } },
      sectionNames: ['open_prs']
    });
    expect(resolved.sections.open_prs.style).toBe('table');
  });

  test('resolveAll: unknown columns are dropped, fallback to defaults if all dropped', () => {
    const resolved = resolveAll({
      fileConfig: { sections: { open_prs: { columns: ['bogus', 'pr'] } } },
      inline: {},
      sectionMeta: { open_prs: { defaultStyle: 'table', defaultColumns: ['pr', 'ref'], availableColumns: { pr: {}, ref: {} } } },
      sectionNames: ['open_prs']
    });
    expect(resolved.sections.open_prs.columns).toEqual(['pr']);

    const empty = resolveAll({
      fileConfig: { sections: { open_prs: { columns: ['bogus'] } } },
      inline: {},
      sectionMeta: { open_prs: { defaultStyle: 'table', defaultColumns: ['pr'], availableColumns: { pr: {} } } },
      sectionNames: ['open_prs']
    });
    expect(empty.sections.open_prs.columns).toEqual(['pr']);
  });

  test('resolveAll: empty_state cascades through inline > file > defaults > section meta', () => {
    const resolved = resolveAll({
      fileConfig: { defaults: { empty_state: 'global default' } },
      inline: { sections: { open_prs: { empty_state: 'inline wins' } } },
      sectionMeta: { open_prs: { defaultEmptyState: 'meta last' } },
      sectionNames: ['open_prs']
    });
    expect(resolved.sections.open_prs.empty_state).toBe('inline wins');

    const fileResolved = resolveAll({
      fileConfig: { sections: { open_prs: { empty_state: 'file wins over meta' } } },
      inline: {},
      sectionMeta: { open_prs: { defaultEmptyState: 'meta last' } },
      sectionNames: ['open_prs']
    });
    expect(fileResolved.sections.open_prs.empty_state).toBe('file wins over meta');
  });

  test('theme: minimal swaps to plain-text labels with no emoji', () => {
    const merged = mergeDefaults({}, { theme: 'minimal' });
    expect(merged.theme).toBe('minimal');
    expect(merged.status_labels.merged).toBe(MINIMAL_LABELS.merged);
    expect(merged.status_labels.merged).not.toMatch(/\p{Emoji_Presentation}/u);
  });

  test('theme: default keeps emoji labels', () => {
    const merged = mergeDefaults({}, {});
    expect(merged.theme).toBe('default');
    expect(merged.status_labels.merged).toBe(DEFAULT_LABELS.merged);
  });

  test('theme: user status_labels still win over the minimal theme base', () => {
    const merged = mergeDefaults({}, { theme: 'minimal', status_labels: { merged: 'shipped' } });
    expect(merged.status_labels.merged).toBe('shipped');
    expect(merged.status_labels.open).toBe(MINIMAL_LABELS.open);
  });

  test('theme: a section can override the global theme', () => {
    const resolved = resolveAll({
      fileConfig: {},
      inline: { defaults: { theme: 'minimal' }, sections: { open_prs: { theme: 'default' } } },
      sectionMeta: { open_prs: {}, merged_prs: {} },
      sectionNames: ['open_prs', 'merged_prs']
    });
    expect(resolved.sections.open_prs.theme).toBe('default');
    expect(resolved.sections.open_prs.status_labels.open).toBe(DEFAULT_LABELS.open);
    expect(resolved.sections.merged_prs.theme).toBe('minimal');
    expect(resolved.sections.merged_prs.status_labels.merged).toBe(MINIMAL_LABELS.merged);
  });
});
