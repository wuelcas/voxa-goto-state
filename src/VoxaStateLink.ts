import { DocumentLink, Range } from "vscode";

export default class VoxaStateLink extends DocumentLink {
  filePath: string;
  stateName: string;
  constructor(range: Range, path: string, stateName: string) {
    super(range);
    this.filePath = path;
    this.stateName = stateName;
  }
}