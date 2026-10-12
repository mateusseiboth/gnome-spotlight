# gnome-spotlight

Extensão do GNOME Shell 50 em TypeScript 7, empacotada com `bun build`. Leia `doc/` antes
de mexer: lá estão a arquitetura, as regras de busca e as armadilhas do Shell.

## Regras deste repositório

- Camadas: `domain/` (puro), `service/` (orquestração), `provider/` (strategies de busca),
  `infra/gnome/` (único lugar que fala com `gi://` e com o Shell), `ui/` (presenter puro +
  view St), `app/` (raiz de composição), `prefs/` (GTK 4). Domínio, serviço, provedores e o
  presenter NUNCA importam valor de `gi://` ou `resource://`, só `import type`. É isso que
  deixa o `bun test` rodar sem GNOME.
- Imports sempre por alias (`@domain/*`, `@service/*`...). Os aliases existem em
  `tsconfig.base.json` E `bunfig.toml`. O bundle resolve os aliases; `gi://*` e
  `resource://*` ficam externos (`scripts/build.ts`).
- Fonte nova de busca = classe nova em `src/provider/` + uma linha em
  `searchProviderFactory.ts`. Nada de `if` por tipo no serviço.
- Texto de tela vai em inglês no código, marcado com `t("...")` (domínio) ou `_("...")`
  (UI e prefs), sempre com aspas duplas e texto literal. O teste `messageCatalog` reprova
  mensagem sem tradução em `po/pt_BR.po`, tradução órfã e travessão.
- CSS só no molde de `src/style/stylesheet.ts`; claro e escuro saem do mesmo molde.
- Portão de saída: `bun run format:check && bun run lint && bun run typecheck && bun test`.

## Armadilhas que já custaram tempo

- Typecheck em três projetos (`tsconfig.json` para src, `test/tsconfig.json`,
  `scripts/tsconfig.json`). O `@types/bun` declara o `global` do Node, que colide com o
  `global` do Shell. E o tsgolint usa o `tsconfig.json` mais próximo de cada arquivo, por
  isso cada pasta tem o seu.
- `@girs/gnome-shell` 50.0.4 não declara `Util.trySpawn` nem os métodos públicos de
  `SystemActions`. Os adaptadores usam um contrato mínimo com cast na fronteira.
- `Gio.DesktopAppInfo` agora é `GioUnix.DesktopAppInfo`.
- No Shell 50 o `Main.pushModal` não devolve mais estado de grab (`Clutter.GrabState` sumiu).
- Mudança só aparece no Shell real depois de logout/login (Wayland).
- Posição do painel é explícita (`AlignConstraint` no X, `y` calculado). Com `BinLayout` +
  `y_align: START` o Shell 50 centralizou o painel e o jogou para baixo do meio da tela.
- Blur é do Blur my Shell, não nosso. O componente de popups dele vigia o
  `modalDialogGroup` e desfoca, com cantos arredondados, atores com classe de diálogo; o
  painel leva `clipboard-dialog` (o tema do GNOME não estiliza essa classe). Sem o Blur my
  Shell o painel fica sólido (`resolvePanelSurface`). O raio do painel (18px) precisa bater
  com o `dialog-corner-radius` dele. Já tentado e descartado: `Shell.BlurEffect` próprio
  (sem raio de canto, sobra quina quadrada; e desfocar a tela inteira não é o efeito
  desejado).
- Regra do tema GANHA da folha da extensão quando as duas estilizam a mesma propriedade
  (o anel de `StEntry:focus` continuou mesmo com `!important` na nossa). Para mudar
  propriedade que o tema já define num ator nativo, use estilo inline (`style:` /
  `set_style`), que o St aplica por último.
