import { languages, ExtensionContext, workspace, RelativePattern } from "vscode";
import VoxaStatesLinkProvider from "./VoxaStatesLinkProvider";

export function activate(context: ExtensionContext) {
  if (workspace.workspaceFolders) {
    const pattern = new RelativePattern(workspace.workspaceFolders[0], "src/app/states/**/*.{ts,js}");

    const linkProvider = languages.registerDocumentLinkProvider(
      { scheme: "file", pattern },
      new VoxaStatesLinkProvider(),
    );
    context.subscriptions.push(linkProvider);
  }
}

export function deactivate() {}
