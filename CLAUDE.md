# launchpad-search (repositório gnome-spotlight)

Extensão do GNOME Shell 50 e 51 em TypeScript 7, publicada no extensions.gnome.org como
"Launchpad Search". Leia `doc/` antes de mexer: lá estão a arquitetura, as regras de busca e
as armadilhas do Shell.

O nome da loja só aparece em `metadata.json`, no id do schema, no domínio de tradução e no
prefixo do log. Classes, arquivos e classes CSS usam o nome genérico `Launcher`/`launcher-`.

## Regras deste repositório

- Camadas: `domain/` (puro), `service/` (orquestração), `provider/` (strategies de busca),
  `infra/gnome/` (único lugar que fala com `gi://` e com o Shell), `ui/` (presenter puro +
  view St), `app/` (raiz de composição), `prefs/` (GTK 4). Domínio, serviço, provedores e o
  presenter NUNCA importam valor de `gi://` ou `resource://`, só `import type`. É isso que
  deixa o `bun test` rodar sem GNOME.
- Imports sempre por alias (`@domain/*`, `@service/*`...). Os aliases existem em
  `tsconfig.base.json` E `bunfig.toml`. O build transpila cada módulo alcançável a partir de
  `extension.ts` e `prefs.ts` para um `.js` em `dist/`, troca o alias por caminho relativo
  (`scripts/build/moduleTranspiler.ts`, aliases lidos do `tsconfig.base.json`) e formata com
  o oxfmt. Nada de bundle em arquivo único: o revisor do extensions.gnome.org lê o `dist/`.
- `src/` não tem comentário (o teste `sourceComments` reprova). O porquê das decisões mora
  em `doc/` e nas armadilhas abaixo. Revisor do extensions.gnome.org rejeita código com
  cara de prompt de LLM.
- A extensão não altera configuração de outro schema (atalho do sistema, por exemplo). O
  atalho padrão é Super+Alt+Espaço justamente para não brigar com "trocar fonte de entrada".
- Fonte nova de busca = classe nova em `src/provider/` + uma linha em
  `searchProviderFactory.ts`. Nada de `if` por tipo no serviço.
- Texto de tela vai em inglês no código, marcado com `t("...")` (domínio) ou `_("...")`
  (UI e prefs), sempre com aspas duplas e texto literal. O teste `messageCatalog` reprova
  mensagem sem tradução em `po/pt_BR.po`, tradução órfã e travessão.
- CSS só no molde de `src/style/stylesheet.ts`; claro e escuro saem do mesmo molde.
- Portão de saída: `bun run format:check && bun run lint && bun run typecheck && bun test`.
- Envio: `bun run pack` gera o zip sem `gschemas.compiled` (o Shell compila ao instalar).

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
- A captura de atalho nas preferências pede `inhibit_system_shortcuts` à janela. Sem isso o
  Shell consome qualquer atalho global (o próprio atalho da busca, inclusive) antes de a
  janela de preferências receber a tecla.
- Posição do painel é explícita (`AlignConstraint` no X, `y` calculado). Com `BinLayout` +
  `y_align: START` o Shell 50 centralizou o painel e o jogou para baixo do meio da tela.
- O `modalDialogGroup` usa `BinLayout`: `set_position`/`set_size` no fundo da busca não
  valem nada e ele cobre todos os monitores (o painel caía na emenda entre dois). Quem
  prende o fundo ao monitor do ponteiro é o `Layout.MonitorConstraint`, como no `ModalDialog`.
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

## Duplicado de propósito

`scripts/build.ts`, `scripts/pack.ts`, `scripts/build/moduleTranspiler.ts` (e o teste dele),
o teste `sourceComments`, `scripts/i18n/messageCatalog.ts`, `scripts/install.ts`, as configs
de oxlint/oxfmt e `src/types/*.d.ts` existem iguais no repositório
`quick-settings-notifications`. Alterou um, replique no outro na mesma tarefa.
