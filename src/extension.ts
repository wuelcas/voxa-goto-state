import {
  workspace,
  languages,
  Hover,
  ExtensionContext,
  TextDocument,
	Position,
	CancellationToken,
	DocumentLinkProvider,
	DocumentLink,
	ProviderResult,
	Range,
	Uri,
} from "vscode";
import { searchFileForState, getLineNumber } from "./utils";

export function activate(context: ExtensionContext) {
  const link = languages.registerDocumentLinkProvider(
    { scheme: "file", pattern: '**/states/**/*.{ts,js}' },
    new LinkProvider(),
  );
  context.subscriptions.push(link);
}

// this method is called when your extension is deactivated
export function deactivate() {}


class LinkProvider implements DocumentLinkProvider {
	public provideDocumentLinks(document: TextDocument, token: CancellationToken): ProviderResult<DocumentLink[]> {
    let documentLinks = [];
    let index = 0;
    const reg = /to\s?[:=]\s['"][\w\W]+['"]/g;
    while (index < document.lineCount) {
      let line = document.lineAt(index);
      let result = line.text.match(reg);
      if (result !== null) {
        for (let item of result) {
          const splitted = item.split(" ");
					const stateName = splitted[1].replace(/"/g, '').replace(/'/g, "");
					
					if (stateName === "entry" || stateName === "die") {
						continue;
					}
          
					const filePath = searchFileForState(stateName, document);

					if (!filePath) {
						continue;
					}
					
					let start = new Position(line.lineNumber, line.text.indexOf(stateName));
					let end = start.translate(0, stateName.length);
					let documentLink = new VoxaStateLink(new Range(start, end), filePath, stateName);
					documentLinks.push(documentLink);
        }
      }
      index++;
		}

    return documentLinks;
  }

  /**
   * resolveDocumentLink
   */
  public resolveDocumentLink(link: VoxaStateLink, token: CancellationToken): ProviderResult<DocumentLink> {
		const lineNumber = getLineNumber(link.stateName, link.filePath);
		
		if (lineNumber) {
			link.target = Uri.parse(`file:${link.filePath}#${lineNumber}`);
		}

		return link;
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