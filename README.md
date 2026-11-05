# Launchpad Search para GNOME Shell

Barra de busca no Super+Alt+Espaço. Digite e ela acha apps, janelas abertas, faz contas, roda
comandos, navega por pastas, dispara ações do sistema e pesquisa na web.

Feita para o GNOME Shell 50 e 51.

## O que dá para digitar

| Você digita | O que aparece |
| --- | --- |
| `fire` | Apps e janelas abertas que casam com o texto, ações do sistema, e uma conta se o texto for uma |
| `2 + 3 * 4`, `sqrt(2)`, `15%`, `5!` | O resultado. Enter copia para a área de transferência |
| `= pi` | Modo calculadora explícito (aceita constante sozinha) |
| `> htop` | Abre o comando no terminal e deixa o shell aberto para você ler a saída |
| `$ notify-send oi` | Roda o comando em segundo plano, sem janela |
| `~/Doc`, `/usr/sh` | Arquivos e pastas daquele caminho. Tab completa, Enter abre |
| `? gnome shell` | Pesquisa na web |
| `bloquear`, `suspender` | Ações do sistema (bloquear, suspender, reiniciar, desligar, sair) |

Teclas: setas navegam, Enter abre, Tab completa caminho, Esc limpa o texto e o segundo Esc fecha.
Clicar fora da janela também fecha.

A janela abre centralizada no monitor onde está o ponteiro, com o topo a 25% da altura. Com o Blur my
Shell ativo (componente de popups), o painel fica translúcido e desfocado como os outros
popups do GNOME; sem ele, o painel é sólido.

A calculadora aceita `+ - * / ^`, `×` e `÷`, parênteses, `%` (divide por 100), `!`
(fatorial), multiplicação implícita (`2pi`, `2(3+1)`), vírgula ou ponto como decimal, as
constantes `pi`, `tau` e `e`, e as funções `sqrt cbrt abs ln log log2 exp sin cos tan asin
acos atan round floor ceil`. Se a conta usou vírgula, a resposta vem com vírgula.

## Atalho

O padrão é Super+Alt+Espaço. Dá para trocar nas preferências (linha "Atalho", botão
"Alterar", pressione a combinação; Backspace deixa sem atalho).

A extensão não mexe nos atalhos do sistema. Para usar Super+Espaço, tire antes esse atalho de
"Trocar para a próxima fonte de entrada" em Configurações > Teclado > Atalhos.

## Preferências

- Atalho
- Máximo de resultados (3 a 20, padrão 8)
- Endereço da busca na web, com `%s` no lugar do texto (padrão Google)
- Cola dos prefixos

## Instalação

```bash
bun install
bun run install:local   # build + cópia para ~/.local/share/gnome-shell/extensions
gnome-extensions enable launchpad-search@mateusseiboth.github.io
```

No Wayland o Shell só carrega extensão nova, ou código novo de uma já carregada, depois de
sair e entrar na sessão.

## Desenvolvimento

```bash
bun run format:check   # oxfmt
bun run lint           # oxlint --type-aware
bun run typecheck      # TypeScript 7, três projetos (src, test, scripts)
bun test               # domínio, provedores, serviço e presenter
bun run build          # dist/ pronto para o Shell
bun run pack           # build + zip para o extensions.gnome.org
bun scripts/extract-messages.ts   # regenera po/launchpad-search.pot
```

O build transpila cada módulo de `src/` para um `.js` em `dist/` (mesma árvore, imports
relativos, sem comentários) e formata com o oxfmt. O código enviado ao extensions.gnome.org
fica legível para a revisão.

O `pack` gera `launchpad-search@mateusseiboth.github.io.shell-extension.zip` sem o
`gschemas.compiled`: o Shell compila o schema ao instalar pelo site.

A arquitetura, as regras de busca e o que foi descoberto sobre o Shell 50 estão em `doc/`.

## Licença

GPL-2.0-or-later. Texto em `LICENSE`.
