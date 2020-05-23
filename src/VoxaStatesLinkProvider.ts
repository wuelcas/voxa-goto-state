import fs from "fs";
import readLine from "n-readlines";
import {
  DocumentLinkProvider,
  TextDocument,
  DocumentLink,
  Position,
  Range,
  workspace,
  ProviderResult,
  Uri,
} from "vscode";
import VoxaStateLink from "./VoxaStateLink";
import * as regex from "./Regex";

export interface IFilePathWithStates {
  filePath: string;
  states: string[];
}

export default class VoxaStatesLinkProvider implements DocumentLinkProvider {
  public provideDocumentLinks(
    document: TextDocument,
  ): Thenable<DocumentLink[]> {
    const documentLinks: DocumentLink[] = [];

    return VoxaStatesLinkProvider.getAllStatesInFiles().then(
      (filePathsWithItsStates: IFilePathWithStates[]) => {
        for (let index = 0; index < document.lineCount; index++) {
          const line = document.lineAt(index);
          const result = line.text.match(regex.toState);
          if (result !== null) {
            for (let item of result) {
              const splitted = item.split(" ");
              const stateName = splitted[1].replace(regex.quotationMarks, "");

              if (stateName === "entry" || stateName === "die") {
                continue;
              }

              const filePath = VoxaStatesLinkProvider.searchForStateFilePath(
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

  private static async getAllStatesInFiles(): Promise<IFilePathWithStates[]> {
    const includePattern = "**/states/**/*.{ts,js}";
    const excludePattern = "**/states/**/index.{ts,js}";
    const filesWithStates = await workspace.findFiles(
      includePattern,
      excludePattern,
    );
    const filePathsWithItsStates: IFilePathWithStates[] = [];

    filesWithStates.forEach((file) => {
      const fileContent = fs
        .readFileSync(file.path)
        .toString()
        .replace(regex.spacesTabsAndLineBreaks, "");
      const stateMatches = fileContent.match(regex.onState);

      if (stateMatches) {
        const states = stateMatches.map((match: any) => {
          return match
            .replace("onState(", "")
            .replace(regex.quotationMarks, "");
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
    filePathsWithItsStates: IFilePathWithStates[],
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
    const lineNumber = VoxaStatesLinkProvider.getLineNumberForState(
      link.stateName,
      link.filePath,
    );

    if (lineNumber) {
      link.target = Uri.parse(`file:${link.filePath}#${lineNumber}`);
    }

    return link;
  }

  private static getLineNumberForState(
    stateName: string,
    filePath: string,
  ): number {
    const file = new readLine(filePath);
    let lineNumber = 0;
    let lineText;
    while ((lineText = file.next())) {
      lineNumber++;
      if (lineText.toString().includes(`onState("${stateName}"`)) {
        return lineNumber;
      }

      if (lineText.toString().trim() === `"${stateName}",`) {
        return lineNumber;
      }
    }
    return 0;
  }
}
