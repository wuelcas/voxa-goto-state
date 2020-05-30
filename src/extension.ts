import { languages, ExtensionContext } from "vscode";
import VoxaStatesLinkProvider from "./VoxaStatesLinkProvider";

export function activate(context: ExtensionContext) {
  const linkProvider = languages.registerDocumentLinkProvider(
    { scheme: "file", pattern: "**/src/app/states/**/*.{ts,js}" },
    new VoxaStatesLinkProvider(),
  );
  context.subscriptions.push(linkProvider);
}

export function deactivate() {}
