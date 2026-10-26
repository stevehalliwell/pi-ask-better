import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  CURSOR_MARKER,
  Editor,
  Markdown,
  ScrollView,
  type KeybindingsManager,
  type DefaultTextStyle,
  type EditorTheme,
  type MarkdownTheme,
  fuzzyFilter,
  Key,
  matchesKey,
  truncateToWidth,
  type Component,
  type Focusable,
  visibleWidth,
  wrapTextWithAnsi,
} from "@earendil-works/pi-tui";
import { Type } from "typebox";

interface Option {
  label: string;
  description?: string;
  preview?: string;
  recommended?: boolean;
}

interface DisplayOption extends Option {
  customText?: true;
}

const customTextOption: DisplayOption = {
  label: "Enter custom text",
  description: "Type a response instead of selecting a choice.",
  customText: true,
};

interface PanelTheme extends EditorTheme {
  accent: (text: string) => string;
  bold: (text: string) => string;
  muted: (text: string) => string;
  markdown: MarkdownTheme;
}

interface AskUserParams {
  question?: string;
  header?: string;
  tab?: string;
  options?: Option[];
  yesNo?: boolean;
  multiSelect?: boolean;
}

const yesNoOptions: Option[] = [{ label: "Yes" }, { label: "No" }];

type Answer =
  | { tab: string; answer: string }
  | { tab: string; custom: string }
  | { tab: string; answers: string[] };

interface AskUserPayload {
  cancelled: boolean;
  answers: Answer[];
}

interface AskUserDetails extends AskUserPayload {
  question: string;
  options: string[];
}

const OptionSchema = Type.Object(
  {
    label: Type.Optional(Type.String({ description: "Short option label." })),
    description: Type.Optional(Type.String({ description: "Optional explanation below the label." })),
    preview: Type.Optional(Type.String({ description: "Optional focused-option preview." })),
    recommended: Type.Optional(Type.Boolean({ description: "Mark this option as recommended/default." })),
  },
  { additionalProperties: true },
);

const AskUserSchema = Type.Object(
  {
    question: Type.Optional(Type.String({ description: "The focused question for the user." })),
    header: Type.Optional(Type.String({ description: "Optional short panel heading." })),
    tab: Type.Optional(Type.String({ description: "Stable answer key; defaults to Answer." })),
    options: Type.Optional(Type.Array(OptionSchema, { description: "Selectable options; required unless yesNo is true." })),
    yesNo: Type.Optional(Type.Boolean({ description: "Show fixed Yes and No choices with custom text entry." })),
    multiSelect: Type.Optional(Type.Boolean({ description: "Allow multiple checked options; cannot be combined with yesNo." })),
  },
  { additionalProperties: true },
);

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim() : "";
}

function cleanMultiline(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").replace(/\r\n?/g, "\n").trim()
    : "";
}

function normalizeOption(value: unknown): Option | undefined {
  if (typeof value === "string") {
    const label = cleanText(value);
    return label ? { label } : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const label = cleanText(input.label ?? input.title ?? input.text ?? input.value ?? input.name ?? input.option);
  if (!label) return undefined;
  const description = cleanMultiline(input.description ?? input.detail ?? input.details);
  const preview = cleanMultiline(input.preview);
  return {
    label,
    ...(description ? { description } : {}),
    ...(preview ? { preview } : {}),
    ...(input.recommended === true ? { recommended: true } : {}),
  };
}

function normalizeArguments(raw: unknown): AskUserParams {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const optionInput = input.options ?? input.choices ?? input.answers;
  const rawOptions = Array.isArray(optionInput) ? optionInput : optionInput === undefined ? [] : [optionInput];
  const options = rawOptions.map(normalizeOption).filter((option): option is Option => !!option);
  const yesNo = input.yesNo === true;
  const multiSelect = input.multiSelect === true || input.allowMultiple === true || input.multi === true;
  if (yesNo && optionInput !== undefined) {
    throw new Error("ask_user: use either yesNo: true or options, not both.");
  }
  if (yesNo && multiSelect) {
    throw new Error("ask_user: yesNo cannot be combined with multiSelect.");
  }
  if (!yesNo && !options.length) {
    throw new Error("ask_user: provide options or yesNo: true. Ask unconstrained text questions directly in Pi chat.");
  }
  const question = cleanMultiline(input.question ?? input.prompt ?? input.title);
  const header = cleanText(input.header ?? input.title);
  const tab = cleanText(input.tab ?? input.id ?? input.key);
  return {
    ...(question ? { question } : {}),
    ...(header ? { header } : {}),
    ...(tab ? { tab } : {}),
    ...(options.length ? { options } : {}),
    ...(yesNo ? { yesNo: true } : {}),
    multiSelect,
  };
}

function wrap(lines: string[], text: string, width: number, prefix = ""): void {
  const prefixWidth = visibleWidth(prefix);
  const usableWidth = Math.max(1, width - prefixWidth);
  for (const line of wrapTextWithAnsi(text, usableWidth)) lines.push(`${prefix}${line}`);
}

function isPipeTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function splitPipeTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\||\|$/g, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

class AskUserPanel implements Component, Focusable {
  private readonly editor: Editor;
  private readonly selected = new Set<string>();
  private optionIndex = 0;
  private editing = true;
  private customEntry = false;
  private pristine = true;
  private cachedWidth?: number;
  private cachedLines?: string[];
  private readonly viewport: ScrollView;
  private followFocus = true;
  private focusedOptionLine = 0;
  private optionsStartLine = 0;
  private _focused = false;

  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
    this.editor.focused = value && this.editing;
  }

  constructor(
    private readonly params: Required<Pick<AskUserParams, "question" | "tab" | "multiSelect">> & Pick<AskUserParams, "header"> & { options: Option[] },
    private readonly onDone: (payload: AskUserPayload) => void,
    private readonly tui: ConstructorParameters<typeof Editor>[0],
    private readonly theme: PanelTheme,
    private readonly keybindings: KeybindingsManager,
  ) {
    this.viewport = new ScrollView({
      render: (width) => this.renderContent(width),
      invalidate: () => this.invalidate(),
    });
    const editorTheme: EditorTheme = {
      borderColor: (text) => theme.borderColor(text),
      selectList: theme.selectList,
    };
    this.editor = new Editor(this.tui, editorTheme);
    this.editor.onChange = () => {
      if (this.editor.getText().trim()) this.selected.clear();
      this.optionIndex = 0;
      this.refresh(this.tui);
    };
    this.editor.onSubmit = (value) => {
      const custom = cleanMultiline(value);
      if (custom) this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, custom }] });
    };
  }

  private effectiveDefaults(): Option[] {
    const recommended = this.params.options.filter((option) => option.recommended);
    if (this.params.multiSelect ? recommended.length : recommended.length === 1) return recommended;
    return this.params.options[0] ? [this.params.options[0]] : [];
  }

  private displayOptions(): Option[] {
    const defaults = this.effectiveDefaults();
    return [...defaults, ...this.params.options.filter((option) => !defaults.includes(option))];
  }

  private visibleOptions(): DisplayOption[] {
    return [...fuzzyFilter(this.displayOptions(), this.editor.getText(), (option) => `${option.label} ${option.description ?? ""}`), customTextOption];
  }

  private refresh(tui: { requestRender(): void }): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    tui.requestRender();
  }

  private finishDefaults(): void {
    const defaults = this.effectiveDefaults();
    if (!defaults.length) return;
    this.editor.setText("");
    if (this.params.multiSelect) {
      this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answers: defaults.map((option) => option.label) }] });
      return;
    }
    this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answer: defaults[0].label }] });
  }

  private finishOption(option: DisplayOption): void {
    if (option.customText) {
      this.editing = true;
      this.customEntry = true;
      this.editor.focused = this.focused;
      this.refresh(this.tui);
      return;
    }
    const answers = [...this.selected];
    this.editor.setText("");
    if (this.params.multiSelect) {
      if (answers.length) this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answers }] });
      return;
    }
    this.onDone({ cancelled: false, answers: [{ tab: this.params.tab, answer: option.label }] });
  }

  handleInput(data: string): void {
    const options = this.visibleOptions();
    if (this.keybindings.matches(data, "tui.select.cancel")) {
      this.onDone({ cancelled: true, answers: [] });
      return;
    }
    const confirm = this.keybindings.matches(data, this.editing ? "tui.input.submit" : "tui.select.confirm");
    if (this.pristine && confirm && this.params.options.length) {
      this.finishDefaults();
      return;
    }
    if (!confirm) this.pristine = false;
    const pageUp = this.keybindings.matches(data, "tui.select.pageUp") || this.keybindings.matches(data, "tui.editor.pageUp");
    const pageDown = this.keybindings.matches(data, "tui.select.pageDown") || this.keybindings.matches(data, "tui.editor.pageDown");
    if (pageUp || pageDown) {
      this.followFocus = false;
      this.viewport.scrollBy((pageUp ? -1 : 1) * Math.max(1, this.viewport.viewportHeight - 1));
      this.tui.requestRender();
      return;
    }
    this.followFocus = true;
    if (this.editing) {
      if (this.keybindings.matches(data, "tui.select.down") && options.length) {
        this.editing = false;
        this.editor.focused = false;
        this.optionIndex = 0;
        this.refresh(this.tui);
        return;
      }
      const matchingOptions = options.filter((option) => !option.customText);
      if (!this.customEntry && !this.params.multiSelect && matchingOptions.length === 1 && confirm) {
        this.finishOption(matchingOptions[0]);
        return;
      }
      this.editor.handleInput(data);
      this.refresh(this.tui);
      return;
    }

    if (this.keybindings.matches(data, "tui.select.up")) {
      if (this.optionIndex === 0) {
        this.editing = true;
        this.editor.focused = this.focused;
      } else {
        this.optionIndex--;
      }
      this.refresh(this.tui);
      return;
    }
    if (this.keybindings.matches(data, "tui.select.down")) {
      this.optionIndex = Math.min(this.optionIndex + 1, Math.max(0, options.length - 1));
      this.refresh(this.tui);
      return;
    }
    const option = options[this.optionIndex];
    if (option && !option.customText && this.params.multiSelect && matchesKey(data, Key.space)) {
      if (this.selected.has(option.label)) this.selected.delete(option.label);
      else this.selected.add(option.label);
      this.refresh(this.tui);
      return;
    }
    if (option && confirm) {
      this.finishOption(option);
      return;
    }
    this.editor.handleInput(data);
  }

  render(width: number): string[] {
    const renderWidth = Math.max(1, width);
    // Keep transcript space in both regular and fullscreen modes.
    const height = Math.max(1, Math.floor(this.tui.terminal.rows * 0.6));
    const framed = renderWidth >= 5 && height >= 6;
    const contentWidth = framed ? renderWidth - 4 : renderWidth;
    const lines = this.viewport.render(contentWidth);
    const viewportHeight = Math.max(1, height - (framed ? 5 : 0));
    this.viewport.updateLayout(lines.length, viewportHeight, () => this.tui.requestRender());
    if (this.followFocus) {
      const cursorLine = lines.findIndex((line) => line.includes(CURSOR_MARKER));
      const target = this.editing ? Math.max(0, cursorLine) : this.optionsStartLine + this.focusedOptionLine;
      if (target < this.viewport.scrollTop) this.viewport.scrollTo(target);
      else if (target >= this.viewport.scrollTop + viewportHeight) this.viewport.scrollTo(target - viewportHeight + 1);
    }
    const visible = lines.slice(this.viewport.scrollTop, this.viewport.scrollTop + viewportHeight);
    if (!framed) return visible;
    const keys = (action: Parameters<KeybindingsManager["getKeys"]>[0]) => this.keybindings.getKeys(action).join("/") || "unbound";
    const scrollKeys = (direction: "pageUp" | "pageDown") => {
      const reserved = this.tui.mode === "fullscreen" ? this.keybindings.getKeys(`tui.altScreen.${direction}`) : [];
      return [...new Set([...this.keybindings.getKeys(`tui.select.${direction}`), ...this.keybindings.getKeys(`tui.editor.${direction}`)])]
        .filter((key) => !reserved.includes(key)).join("/") || "unbound";
    };
    const status = lines.length > viewportHeight
      ? `${this.viewport.scrollTop + 1}–${Math.min(lines.length, this.viewport.scrollTop + viewportHeight)} of ${lines.length} · `
      : "";
    visible.push(truncateToWidth(this.theme.muted(`${status}${scrollKeys("pageUp")} / ${scrollKeys("pageDown")} scroll`), contentWidth));
    visible.push(truncateToWidth(this.theme.muted(
      `${keys("tui.select.down")} choices · ${keys("tui.select.up")} answer · ${this.params.multiSelect ? "Space toggle · " : ""}${keys(this.editing ? "tui.input.submit" : "tui.select.confirm")} submit · ${keys("tui.select.cancel")} cancel`,
    ), contentWidth));
    return this.frame(visible, renderWidth, contentWidth);
  }

  private renderContent(contentWidth: number): string[] {
    if (this.cachedWidth === contentWidth && this.cachedLines) return this.cachedLines;
    const options = this.visibleOptions();
    const lines: string[] = [];
    const add = (text: string) => lines.push(truncateToWidth(text, contentWidth, ""));

    if (this.params.header) wrap(lines, this.theme.bold(this.params.header), contentWidth);
    lines.push(
      ...this.renderMarkdown(this.params.question || "What would you like to do?", contentWidth, {
        color: this.theme.accent,
        bold: true,
      }),
    );
    add("");
    add(this.theme.bold(this.customEntry ? "Custom answer" : "Your answer"));
    for (const line of this.editor.render(contentWidth)) add(line);

    add("");
    add(this.theme.bold("Choices"));
    this.optionsStartLine = lines.length;
    if (options.length) {
      const preview = options[this.optionIndex]?.preview;
      const split = !!preview && contentWidth >= 88;
      if (split) {
        const leftWidth = Math.floor((contentWidth - 3) / 2);
        const rightWidth = contentWidth - leftWidth - 3;
        const optionLines = this.renderOptions(options, leftWidth);
        const previewLines = this.renderMarkdown(preview, rightWidth);
        const rowCount = Math.max(optionLines.length, previewLines.length);
        for (let index = 0; index < rowCount; index++) {
          const left = optionLines[index] ?? "";
          const right = previewLines[index] ?? "";
          add(`${left}${" ".repeat(Math.max(0, leftWidth - visibleWidth(left)))} │ ${right}`);
        }
      } else {
        for (const line of this.renderOptions(options, contentWidth)) add(line);
        if (preview) {
          add("");
          for (const line of this.renderMarkdown(preview, contentWidth - 2)) add(`  ${line}`);
        }
      }
    } else {
      add(this.theme.muted("No matching options — press Enter to submit free text."));
    }

    this.cachedWidth = contentWidth;
    this.cachedLines = lines;
    return this.cachedLines;
  }

  private renderMarkdown(text: string, width: number, defaultTextStyle?: DefaultTextStyle): string[] {
    const renderWidth = Math.max(1, width);
    const sourceLines = text.split("\n");
    const lines: string[] = [];
    const markdownLines: string[] = [];
    let inFence = false;
    const flushMarkdown = () => {
      if (!markdownLines.length) return;
      lines.push(...new Markdown(markdownLines.join("\n"), 0, 0, this.theme.markdown, defaultTextStyle).render(renderWidth));
      markdownLines.length = 0;
    };

    for (let index = 0; index < sourceLines.length; index++) {
      const line = sourceLines[index];
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (!inFence && index + 1 < sourceLines.length && line.includes("|") && isPipeTableDivider(sourceLines[index + 1])) {
        flushMarkdown();
        const rows = [splitPipeTableRow(line)];
        index += 2;
        while (index < sourceLines.length && sourceLines[index].includes("|")) {
          rows.push(splitPipeTableRow(sourceLines[index]));
          index++;
        }
        index--;
        lines.push(...this.renderPipeTable(rows, renderWidth, defaultTextStyle));
        if (sourceLines[index + 1]?.trim()) lines.push("");
        continue;
      }
      markdownLines.push(line);
    }
    flushMarkdown();
    return lines;
  }

  private renderPipeTable(rows: string[][], width: number, defaultTextStyle?: DefaultTextStyle): string[] {
    const columnCount = Math.max(...rows.map((row) => row.length));
    if (!columnCount || width < columnCount * 2 + 1) return new Markdown(rows.map((row) => row.join(" | ")).join("\n"), 0, 0, this.theme.markdown, defaultTextStyle).render(Math.max(1, width));
    const boxed = width >= columnCount * 4 + 1;
    const cellWidth = boxed ? width - (columnCount * 3 + 1) : width - (columnCount + 1);
    const columnWidths = Array.from({ length: columnCount }, (_, index) => Math.floor(cellWidth / columnCount) + (index < cellWidth % columnCount ? 1 : 0));
    const cell = (text: string, column: number, header = false) => {
      const sourceWidth = Math.max(1, visibleWidth(text));
      const rendered = new Markdown(text, 0, 0, this.theme.markdown, defaultTextStyle).render(sourceWidth).join(" ").trimEnd();
      const truncated = truncateToWidth(rendered, columnWidths[column], "...", true);
      return header ? this.theme.bold(truncated) : truncated;
    };
    const row = (cells: string[], header = false) => {
      const rendered = columnWidths.map((_, index) => cell(cells[index] ?? "", index, header));
      return boxed ? `│ ${rendered.join(" │ ")} │` : `|${rendered.join("|")}|`;
    };
    if (!boxed) {
      const divider = `|${columnWidths.map((columnWidth) => "-".repeat(columnWidth)).join("|")}|`;
      return [row(rows[0], true), divider, ...rows.slice(1).map((cells) => row(cells))];
    }
    const dividerCells = columnWidths.map((columnWidth) => "─".repeat(columnWidth));
    const divider = `├─${dividerCells.join("─┼─")}─┤`;
    return [
      `┌─${dividerCells.join("─┬─")}─┐`,
      row(rows[0], true),
      divider,
      ...rows.slice(1).flatMap((cells, index) => (index ? [divider, row(cells)] : [row(cells)])),
      `└─${dividerCells.join("─┴─")}─┘`,
    ];
  }

  private frame(lines: string[], width: number, contentWidth: number): string[] {
    if (width < 5) return lines.map((line) => truncateToWidth(line, width));
    const border = this.theme.accent;
    const frameLine = (line: string) => {
      const truncated = truncateToWidth(line, contentWidth);
      return `${border("│")} ${truncated}${" ".repeat(Math.max(0, contentWidth - visibleWidth(truncated)))} ${border("│")}`;
    };
    return [
      border(`┌${"─".repeat(width - 2)}┐`),
      frameLine(this.theme.accent(this.theme.bold("Your decision"))),
      ...lines.map(frameLine),
      border(`└${"─".repeat(width - 2)}┘`),
    ];
  }

  private renderOptions(options: DisplayOption[], width: number): string[] {
    const lines: string[] = [];
    const defaults = this.effectiveDefaults();
    const hasExplicitRecommendation = this.params.options.some((option) => option.recommended);
    for (const [index, option] of options.entries()) {
      if (index === this.optionIndex) this.focusedOptionLine = lines.length;
      const focused = this.editing
        ? !this.params.multiSelect && options.length === 1
        : index === this.optionIndex;
      const selected = this.selected.has(option.label);
      const marker = focused ? ">" : " ";
      const checkbox = this.params.multiSelect ? (selected ? "[x] " : "[ ] ") : "";
      const recommendation = option.recommended
        ? this.theme.accent(" - recommended")
        : !hasExplicitRecommendation && defaults.includes(option)
          ? this.theme.accent(" - default")
          : "";
      const optionPrefix = `${marker} ${checkbox}`;
      const labelWidth = Math.max(1, width - visibleWidth(optionPrefix) - visibleWidth(recommendation));
      for (const [lineIndex, line] of this.renderMarkdown(option.label, labelWidth, { bold: true }).entries()) {
        lines.push(`${lineIndex === 0 ? optionPrefix : " ".repeat(visibleWidth(optionPrefix))}${line.trimEnd()}${lineIndex === 0 ? recommendation : ""}`);
      }
      if (option.description) {
        for (const line of this.renderMarkdown(option.description, width - 4, { color: this.theme.muted })) lines.push(`    ${line}`);
      }
    }
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    this.editor.invalidate();
  }
}

function detailsFor(params: AskUserParams, payload: AskUserPayload): AskUserDetails {
  return {
    ...payload,
    question: params.question ?? "",
    options: (params.yesNo ? yesNoOptions : params.options ?? []).map((option) => option.label),
  };
}

export default function askBetter(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    const active = pi.getActiveTools().filter((name) => name !== "ask_user");
    pi.setActiveTools(ctx.mode === "tui" ? [...active, "ask_user"] : active);
  });

  pi.registerTool({
    name: "ask_user",
    label: "Ask User",
    exposure: "model-only",
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    description:
      "Ask one focused question with options or yesNo: true. For unconstrained text, ask directly in Pi chat. Do not queue dependent questions. Result JSON: { cancelled, answers: [{ tab, answer|custom|answers }] }.",
    promptSnippet: "Ask one focused structured question when a user decision is needed",
    promptGuidelines: [
      "When examples would help the user choose, provide them before asking or in each option's Markdown preview. Do not offer to show examples as a selectable option.",
      "Use ask_user for every focused, structured question that needs a user answer before continuing: a clarification, preference, recommendation approval, confirmation, or choice between alternatives. Do not ask such questions in assistant prose or end a response by asking the user to choose, approve, confirm, or clarify; call ask_user instead. First inspect what you can and proceed without asking when the answer is already clear or a reversible default is sufficient. Use options or yesNo: true; ask dependent questions one at a time. Ask unconstrained or substantial text questions directly in Pi chat.",
    ],
    parameters: AskUserSchema,
    prepareArguments: (raw) => normalizeArguments(raw) as never,
    executionMode: "sequential",
    async execute(_toolCallId, params, signal, _onUpdate, ctx) {
      const normalized = normalizeArguments(params);
      if (ctx.mode !== "tui" || signal?.aborted) {
        const payload: AskUserPayload = { cancelled: true, answers: [] };
        return {
          content: [{ type: "text", text: JSON.stringify(payload) }],
          details: detailsFor(normalized, payload),
        };
      }
      const panelParams = {
        question: normalized.question ?? "",
        header: normalized.header,
        tab: normalized.tab || "Answer",
        options: normalized.yesNo ? yesNoOptions : normalized.options ?? [],
        multiSelect: normalized.multiSelect === true,
      };
      let onAbort: (() => void) | undefined;
      let abortTimer: ReturnType<typeof setTimeout> | undefined;
      let payload: AskUserPayload;
      ctx.ui.setWorkingVisible(false);
      try {
        payload = await ctx.ui.custom<AskUserPayload>(
          (tui, theme, keybindings, done) => {
            // custom() mounts after the factory returns; close only after that microtask.
            onAbort = () => {
              abortTimer ??= setTimeout(() => done({ cancelled: true, answers: [] }), 0);
            };
            const panel = new AskUserPanel(panelParams, done, tui, {
              accent: (text) => theme.fg("accent", text),
              bold: (text) => theme.bold(text),
              muted: (text) => theme.fg("muted", text),
              markdown: {
                heading: (text) => theme.fg("accent", theme.bold(text)),
                link: (text) => theme.fg("accent", text),
                linkUrl: (text) => theme.fg("muted", text),
                code: (text) => theme.fg("warning", text),
                codeBlock: (text) => theme.fg("warning", text),
                codeBlockBorder: (text) => theme.fg("muted", text),
                quote: (text) => theme.fg("muted", text),
                quoteBorder: (text) => theme.fg("muted", text),
                hr: (text) => theme.fg("muted", text),
                listBullet: (text) => theme.fg("accent", text),
                bold: (text) => theme.bold(text),
                italic: (text) => theme.fg("accent", text),
                strikethrough: (text) => theme.fg("muted", text),
                underline: (text) => theme.fg("accent", text),
              },
              borderColor: (text) => theme.fg("accent", text),
              selectList: {
                selectedPrefix: (text) => theme.fg("accent", text),
                selectedText: (text) => theme.fg("accent", text),
                description: (text) => theme.fg("muted", text),
                scrollInfo: (text) => theme.fg("dim", text),
                noMatch: (text) => theme.fg("warning", text),
              },
            }, keybindings);
            signal?.addEventListener("abort", onAbort, { once: true });
            if (signal?.aborted) onAbort();
            return panel;
          },
          { overlay: false },
        );
      } finally {
        if (onAbort) signal?.removeEventListener("abort", onAbort);
        if (abortTimer !== undefined) clearTimeout(abortTimer);
        ctx.ui.setWorkingVisible(true);
      }
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
        details: detailsFor(panelParams, payload),
      };
    },
  });
}
