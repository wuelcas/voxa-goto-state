import { languages, ExtensionContext } from "vscode";
import VoxaStatesLinkProvider from "./VoxaStatesLinkProvider";
import VoxaStatesCompletionItemProvider from "./VoxaStatesCompletionItemProvider";

export function activate(context: ExtensionContext) {
  const linkProvider = languages.registerDocumentLinkProvider(
    { scheme: "file", pattern: "**/states/**/*.{ts,js}" },
    new VoxaStatesLinkProvider(),
  );
  const completionItemProvider = languages.registerCompletionItemProvider(
    { scheme: "file", pattern: "**/states/**/*.{ts,js}" },
    new VoxaStatesCompletionItemProvider(),
    ...['"', "'"],
  );
  context.subscriptions.push(linkProvider);
  context.subscriptions.push(completionItemProvider);
}

export function deactivate() {}
