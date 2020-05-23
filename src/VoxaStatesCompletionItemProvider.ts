import fs from "fs";
import {
  CompletionItemProvider,
  workspace,
  RelativePattern,
  TextDocument,
  Position,
  CompletionItem,
  CompletionItemKind,
} from "vscode";
import * as regex from "./Regex";

export default class VoxaStatesCompletionItemProvider
  implements CompletionItemProvider {
  private states: string[] = [];
  private watcher: any = null;

  constructor() {
    this.loadStates();
    if (workspace.workspaceFolders !== undefined) {
      this.watcher = workspace.createFileSystemWatcher(
        new RelativePattern(
          workspace.workspaceFolders[0],
          "**/states/**/*.{ts,js}",
        ),
      );
      this.watcher.onDidChange(() => this.onChange());
      this.watcher.onDidCreate(() => this.onChange());
      this.watcher.onDidDelete(() => this.onChange());
    }
  }

  provideCompletionItems(
    document: TextDocument,
    position: Position,
  ): CompletionItem[] {
    const out: CompletionItem[] = [];
    const textInPosition = document.lineAt(position.line).text.trim();

    if (textInPosition.match(regex.toKeywordWithoutState)) {
      out.push(
        ...this.states.map(
          (state) => new CompletionItem(state, CompletionItemKind.Reference),
        ),
      );
    }

    return out;
  }

  private onChange() {
    this.loadStates();
  }

  private async loadStates() {
    const includePattern = "**/states/**/*.{ts,js}";
    const excludePattern = "**/states/**/index.{ts,js}";
    const filesWithStates = await workspace.findFiles(
      includePattern,
      excludePattern,
    );
    const states: string[] = [];

    filesWithStates.forEach((file) => {
      const fileContent = fs
        .readFileSync(file.path)
        .toString()
        .replace(regex.spacesTabsAndLineBreaks, "");
      const stateMatches = fileContent.match(regex.onState);

      if (stateMatches) {
        states.push(
          ...stateMatches.map((match: string) => {
            return match
              .replace("onState(", "")
              .replace(/'/g, "")
              .replace(/"/g, "");
          }),
        );
      }
    });

    this.states = [...new Set(states)];
  }
}
