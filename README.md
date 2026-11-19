# Launchpad Search para GNOME Shell

Barra de busca no Super+Alt+Espaço. Digite e ela acha apps, janelas abertas, faz contas e
conversões de unidade, roda comandos, navega por pastas, dispara ações do sistema, pesquisa na
web e mostra os resultados dos provedores de busca do panorama (Configurações, Arquivos,
Software, extensões que registram provedor).

Feita para o GNOME Shell 48, 50 e 51.

## O que dá para digitar

| Você digita | O que aparece |
| --- | --- |
| `fire` | Apps e janelas abertas que casam com o texto, ações do sistema, e uma conta se o texto for uma |
| `2 + 3 * 4`, `sqrt(2)`, `15%`, `5!` | O resultado. Enter copia para a área de transferência |
| `= pi` | Modo calculadora explícito (aceita constante sozinha) |
| `2 inch em cm`, `100 f in c` | Conversão de unidade pela Calculadora do GNOME. Enter copia |
| `> htop` | Abre o comando no terminal e deixa o shell aberto para você ler a saída |
| `$ notify-send oi` | Roda o comando em segundo plano, sem janela |
| `~/Doc`, `/usr/sh` | Arquivos e pastas daquele caminho. Tab completa, Enter abre |
| `? gnome shell` | Os 10 primeiros resultados do DuckDuckGo, mais a linha que abre a busca completa |
| `@y gatos`, `@w gnome` | Atalho de busca: abre a pesquisa do site configurado (YouTube, Wikipédia...) |
| `wi-fi`, `bateria` | Também os resultados dos provedores do panorama (painéis de Configurações, por exemplo) |
| `bloquear`, `suspender` | Ações do sistema (bloquear, suspender, reiniciar, desligar, sair) |

Teclas: setas navegam, Enter abre, Tab completa caminho, Esc limpa o texto e o segundo Esc fecha.
Clicar fora da janela ou pressionar o atalho novamente também fecha, mesmo com texto na busca.

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
- Máximo de resultados (3 a 20, padrão 8; a busca com `?` mostra pelo menos 11 linhas)
- Endereço da busca na web, com `%s` no lugar do texto (padrão Google)
- Cola dos prefixos
- Atalhos de busca: palavra (`@y`) + endereço com `%s`. Vêm `@y` (YouTube) e `@w`
  (Wikipédia); a lista aceita incluir e remover

## Internet e outros provedores

- Só a busca com `?` consulta a internet sozinha: o texto vai para
  `html.duckduckgo.com`, depois de 350 ms sem digitar. O DuckDuckGo não tem API oficial de
  resultados e às vezes responde com a página anti-robô (HTTP 202); nesse caso só aparece a
  linha que abre a busca no navegador, e o motivo vai para o log do Shell.
- Conversão de unidade usa o provedor de busca da Calculadora do GNOME por D-Bus, o mesmo que
  o panorama consulta. Sem a Calculadora instalada, a conversão simplesmente não aparece.
- Os provedores do panorama são os mesmos que o GNOME usa ao digitar na Visão geral, e
  respeitam o que estiver ligado em Configurações > Pesquisar. Cada um aparece quando
  responde; um provedor lento não segura os outros.

## Traduções

Português do Brasil (`po/pt_BR.po`) e alemão (`po/de.po`, contribuição de
[Malte H.](https://github.com/raqu1n), obrigado!). Tradução nova é um `po/<idioma>.po`; o
teste de catálogo reprova mensagem faltando, órfã ou com travessão em qualquer idioma.

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
