# Integração com o GNOME Shell 50

Conferido contra o código do gnome-shell 50.5 instalado (extraído de
`/usr/lib64/gnome-shell/libshell-18.so` com `gresource extract`).

| Necessidade | API usada | Onde |
| --- | --- | --- |
| Apps instalados | `Shell.AppSystem.get_installed()`, `lookup_app(id).activate()`, sinal `installed-changed` | `shellAppCatalog.ts` |
| Frequência de uso | `Shell.AppUsage.get_most_used()` | `shellAppCatalog.ts` |
| Janelas | `global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null)`, `Shell.WindowTracker`, `Main.activateWindow` | `shellWindowCatalog.ts` |
| Ações do sistema | `misc/systemActions.js` `getMatchingActions`, `getName`, `getIconName`, `activateAction` | `shellSystemActionCatalog.ts` |
| Pastas | `Gio.File.enumerate_children_async` + `next_files_async` (promisificados) | `gioDirectoryReader.ts` |
| Abrir URL e arquivo | `Gio.AppInfo.launch_default_for_uri` com `global.create_app_launch_context` | `shellLauncher.ts` |
| Área de transferência | `St.Clipboard.get_default().set_text(CLIPBOARD, ...)` | `stClipboard.ts` |
| Rodar comando | `misc/util.js` `trySpawn` | `shellCommandRunner.ts` |
| Atalho global | `Main.wm.addKeybinding` / `removeKeybinding` | `spotlightSession.ts` |
| Janela modal | `Main.pushModal(actor, {actionMode: SYSTEM_MODAL})`, ator em `Main.layoutManager.modalDialogGroup` | `spotlightOverlay.ts` |
| Blur do painel | Blur my Shell: classe `clipboard-dialog` no painel; detecção por `global.blur_my_shell` | `spotlightOverlay.ts`, `blurProvider.ts` |
| Rolagem até a linha | `misc/animationUtils.js` `ensureActorVisibleInScrollView` | `spotlightOverlay.ts` |
| CSS claro/escuro | O Shell carrega `stylesheet-<variante>.css` antes de `stylesheet.css` (`extensionSystem.js`) | `scripts/build.ts` |
| Tradução | `this.gettext` da instância de `Extension` | `extension.ts` |

## Observações

- O `gettext` exportado por `extension.js` descobre a extensão pela pilha de chamadas. Com o
  bundle funciona, mas a extensão passa `this.gettext` da instância, que não depende disso.
- A janela abre no monitor em foco (`Main.layoutManager.currentMonitor`), com o topo a 25%
  da altura.
  Com a Visão geral aberta, ela fecha a Visão geral antes.
- Shell 50 já tem toggle de "Não perturbe"; não tem relação com esta extensão, mas aparece
  nas mesmas fontes consultadas.
