import * as fs from "fs";
import readLine from "n-readlines";
import {
  workspace,
  languages,
  ExtensionContext,
  TextDocument,
  Position,
  DocumentLinkProvider,
  DocumentLink,
  ProviderResult,
  Range,
  Uri,
} from "vscode";

export function activate(context: ExtensionContext) {
  const link = languages.registerDocumentLinkProvider(
    { scheme: "file", pattern: "**/states/**/*.{ts,js}" },
    new LinkProvider(),
  );
  context.subscriptions.push(link);
}

// this method is called when your extension is deactivated
export function deactivate() {}

interface IFilePathWithItsStates {
  filePath: string;
  states: string[];
}

class LinkProvider implements DocumentLinkProvider {
  public provideDocumentLinks(
    document: TextDocument,
  ): Thenable<DocumentLink[]> {
    const documentLinks: DocumentLink[] = [];
    const toStateRegex = /to\s?[:=]\s['"][\w\W]+['"]/g;

    return LinkProvider.getAllStatesInFiles().then(
      (filePathsWithItsStates: IFilePathWithItsStates[]) => {
        for (let index = 0; index < document.lineCount; index++) {
          const line = document.lineAt(index);
          const result = line.text.match(toStateRegex);
          if (result !== null) {
            for (let item of result) {
              const splitted = item.split(" ");
              const stateName = splitted[1].replace(/"/g, "").replace(/'/g, "");

              if (stateName === "entry" || stateName === "die") {
                continue;
              }

              const filePath = LinkProvider.searchForStateFilePath(
                stateName,
                filePathsWithItsStates,
              );

              if (!filePath) {
                continue;
              }

              const start = new Position(
                line.lineNumber,
                line.text.indexOf(stateName),
              );
              const end = start.translate(0, stateName.length);
              const documentLink = new VoxaStateLink(
                new Range(start, end),
                filePath,
                stateName,
              );
              documentLinks.push(documentLink);
            }
          }
        }

        return documentLinks;
      },
    );
  }

  private static async getAllStatesInFiles(): Promise<
    IFilePathWithItsStates[]
  > {
    const includePattern = "**/states/**/*.{ts,js}";
    const excludePattern = "**/states/**/index.{ts,js}";
    const filesWithStates = await workspace.findFiles(
      includePattern,
      excludePattern,
    );
    const filePathsWithItsStates: IFilePathWithItsStates[] = [];

    filesWithStates.forEach((file) => {
      const contentWithLineBreaksAndTabs = fs
        .readFileSync(file.path)
        .toString()
        .replace(/\s{2,}|\t|\r\n|\n|\r|/g, "");
      const onStateRegex = /onState[(]['"][^"]+['"]/g;
      const stateMatches = contentWithLineBreaksAndTabs.match(onStateRegex);

      if (stateMatches) {
        const states = stateMatches.map((match) => {
          return match
            .replace("onState(", "")
            .replace(/'/g, "")
            .replace(/"/g, "");
        });

        filePathsWithItsStates.push({
          filePath: file.path,
          states,
        });
      }
    });

    return filePathsWithItsStates;
  }

  private static searchForStateFilePath(
    stateName: string,
    filePathsWithItsStates: IFilePathWithItsStates[],
  ): string | null {
    const result = filePathsWithItsStates.find((filePathAndStates) => {
      return filePathAndStates.states.includes(stateName);
    });

    if (!result) {
      return null;
    }

    return result.filePath;
  }

  public resolveDocumentLink(
    link: VoxaStateLink,
  ): ProviderResult<DocumentLink> {
    const lineNumber = LinkProvider.getLineNumber(
      link.stateName,
      link.filePath,
    );

    if (lineNumber) {
      link.target = Uri.parse(`file:${link.filePath}#${lineNumber}`);
    }

    return link;
  }

  private static getLineNumber(stateName: string, filePath: string): number {
    const file = new readLine(filePath);
    let lineNumber = 0;
    let lineText;
    while ((lineText = file.next())) {
      lineNumber++;
      if (lineText.toString().includes(`onState("${stateName}"`)) {
        return lineNumber;
      }

      if (
        lineText
          .toString()
          .replace(/\s{2,}/g, "")
          .replace(/\t/g, "") === `"${stateName}",`
      ) {
        return lineNumber;
      }
    }
    return 0;
  }
}

class VoxaStateLink extends DocumentLink {
  filePath: string;
  stateName: string;
  constructor(range: Range, path: string, stateName: string) {
    super(range);
    this.filePath = path;
    this.stateName = stateName;
  }
}
