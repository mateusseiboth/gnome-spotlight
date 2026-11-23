# Integração com o GNOME Shell 50

Conferido contra o código do gnome-shell 50.5 instalado (extraído de
`/usr/lib64/gnome-shell/libshell-18.so` com `gresource extract`).

| Necessidade | API usada | Onde |
| --- | --- | --- |
| Apps instalados | `Shell.AppSystem.get_installed()`, `lookup_app(id).activate()`, `lookup_app(id).open_new_window(-1)`, sinal `installed-changed` | `shellAppCatalog.ts` |
| Frequência de uso | `Shell.AppUsage.get_most_used()` | `shellAppCatalog.ts` |
| Janelas | `global.display.get_tab_list(Meta.TabList.NORMAL_ALL, null)`, `Shell.WindowTracker`, `Main.activateWindow` | `shellWindowCatalog.ts` |
| Ações do sistema | `misc/systemActions.js` `getMatchingActions`, `getName`, `getIconName`, `activateAction` | `shellSystemActionCatalog.ts` |
| Pastas | `Gio.File.enumerate_children_async` + `next_files_async` (promisificados) | `gioDirectoryReader.ts` |
| Abrir URL e arquivo | `Gio.AppInfo.launch_default_for_uri` com `global.create_app_launch_context` | `shellLauncher.ts` |
| Área de transferência | `St.Clipboard.get_default().set_text(CLIPBOARD, ...)` | `stClipboard.ts` |
| Rodar comando | `misc/util.js` `trySpawn` | `shellCommandRunner.ts` |
| Atalho global | `Main.wm.addKeybinding` / `removeKeybinding` | `launcherSession.ts` |
| Janela modal | `Main.pushModal(actor, {actionMode: SYSTEM_MODAL})`, ator em `Main.layoutManager.modalDialogGroup` | `launcherOverlay.ts` |
| Blur do painel | Blur my Shell: classe `clipboard-dialog` no painel; detecção por `global.blur_my_shell` | `launcherOverlay.ts`, `blurProvider.ts` |
| Rolagem até a linha | `misc/animationUtils.js` `ensureActorVisibleInScrollView` | `launcherOverlay.ts` |
| CSS claro/escuro | O Shell carrega `stylesheet-<variante>.css` antes de `stylesheet.css` (`extensionSystem.js`) | `scripts/build.ts` |
| Tradução | `this.gettext` da instância de `Extension` | `extension.ts` |
| Resultados da web | `Soup.Session.send_and_read_async` em `html.duckduckgo.com/html/` | `duckDuckGoClient.ts` |
| Conversão de unidade | D-Bus `org.gnome.Calculator.SearchProvider`, `GetInitialResultSet` + `GetResultMetas` (`clipboardText`) | `gnomeCalculatorConverter.ts` |
| Provedores do panorama | `searchController._searchResults._providers`: `getInitialResultSet`, `filterResults`, `getResultMetas`, `activateResult(id, terms)` | `shellOverviewProviderCatalog.ts` |

## Observações

- Provedores do panorama demoram muito diferente: no teste, a maioria respondeu em menos de
  200 ms, o Software levou 6 s e Agenda e Firefox não responderam em 12 s. Por isso o
  serviço entrega a lista aos poucos em vez de esperar todos.
- Provedor de extensão costuma ter `appInfo = null`; aí o rótulo da linha é "Busca" em vez do
  nome do app. O ícone vem de `createIcon(size)` (só o `gicon` de um `St.Icon` é
  aproveitado; o ator é destruído em seguida), senão do `appInfo`.
- A Calculadora responde conforme o idioma da sessão: `2 inch em cm` dá `5,08` em pt_BR.
  Câmbio (`10 usd to brl`) não respondeu no teste.
- Na desativação a view zera o presenter antes de destruir os atores: resultado remoto que
  chega depois iria desenhar num `St.BoxLayout` já destruído.

- Com a busca aberta, o Shell entra no modo `SYSTEM_MODAL`. O atalho funciona nesse modo para
  fechar a busca, mas não a abre quando outro diálogo modal está ativo.
- O Enter puro pode ser consumido pelo ibus antes de chegar ao `key-press-event`. Por isso a
  view escuta também o sinal `activate` do `ClutterText` (só ele recebe o Enter puro nesse
  caso). Enter com modificador chega ao `key-press-event`, que devolve `EVENT_STOP` e evita a
  ativação dupla; é por aí que Ctrl+Enter abre janela nova.
- O `gettext` exportado por `extension.js` descobre a extensão pela pilha de chamadas. Com o
  bundle funciona, mas a extensão passa `this.gettext` da instância, que não depende disso.
- A janela abre no monitor onde está o ponteiro (`Main.layoutManager.currentMonitor`), com
  o topo a 25% da altura. O fundo é preso a esse monitor por `Layout.MonitorConstraint`: o
  `modalDialogGroup` usa `BinLayout` e ignora posição e tamanho fixos do filho.
  Com a Visão geral aberta, ela fecha a Visão geral antes.
- Shell 50 já tem toggle de "Não perturbe"; não tem relação com esta extensão, mas aparece
  nas mesmas fontes consultadas.
