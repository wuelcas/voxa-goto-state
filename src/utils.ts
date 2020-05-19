import { TextDocument } from "vscode";
import * as path from "path";
import readLine from "n-readlines";

export function searchFileForState(
  stateName: string,
  currentDoc: TextDocument,
): string {
  const currentDocText = currentDoc
    .getText()
    .replace(/\s{2,}|\t|\r\n|\n|\r|/g, "");
  if (currentDocText.includes(`onState("${stateName}"`)) {
    return currentDoc.fileName;
  }

  const currentDocFolder = currentDoc.fileName.replace(
    path.basename(currentDoc.fileName),
    "",
  );
  // List all files in folder except current and index
  // Search in every file for the state text

  return "";
}

export function getLineNumber(stateName: string, filePath: string): number {
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
