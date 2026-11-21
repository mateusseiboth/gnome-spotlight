# Arquitetura

## Fluxo de uma busca

1. `LauncherOverlay` (St) recebe o texto da caixa e chama `LauncherPresenter.onQueryChanged`.
2. O presenter pede um token ao `LatestRequestGate` e chama `SearchService.search`.
3. O serviço lê a lista de provedores (a factory devolve uma função: os da extensão mais um
   `OverviewSearchProvider` por provedor que o panorama tem naquele momento), lê o modo com
   `parseQuery` (prefixo), filtra os que atendem o modo e consulta todos em paralelo.
4. Junta os resultados, mantém o de maior nota quando dois têm o mesmo `id`, ordena por nota
   e depois por título, corta no limite das preferências (`?` mostra pelo menos 11).
5. Provedor com `isRemote` (internet, D-Bus, panorama) não segura a lista: quando os locais
   terminam, o serviço entrega uma prévia pelo `onUpdate`, e entrega de novo a cada remoto que
   responde, só se a lista mudou. A promessa final traz a lista completa.
6. Se o token ainda é o mais novo, o presenter manda a view desenhar (prévia e final). Resposta
   atrasada é descartada. Se o usuário já moveu a seleção, a lista nova mantém o item
   selecionado.
7. Enter ou clique: o presenter FECHA a janela e só depois chama `result.activate()`. Fechar
   antes devolve o foco às janelas, senão o app recém-aberto nasce atrás. Ctrl+Enter usa
   `result.activateInNewWindow()` quando existe (apps abrem janela nova); sem ele, cai na
   ativação normal.

## Camadas

| Pasta | Papel | Pode importar valor de `gi://`? |
| --- | --- | --- |
| `src/domain` | Regras puras: casamento de texto, calculadora, caminhos, terminal, atalho | Não |
| `src/service` | `SearchService` | Não |
| `src/provider` | Uma strategy por fonte de resultado + a factory | Não |
| `src/ui/launcherPresenter.ts` | Interação (setas, Enter, Tab, Esc) | Não |
| `src/ui` (resto) | View St | Sim |
| `src/infra/gnome` | Adaptadores das portas (`AppCatalog`, `WindowCatalog`...) | Sim |
| `src/app` | `LauncherSession`, a raiz de composição | Sim |
| `src/prefs` | Linha de captura de atalho e lista de atalhos de busca (GTK 4) | Sim |

As portas ficam em `src/domain/*/…Ports.ts`. Cada adaptador do Shell implementa uma.
Os testes usam portas falsas em `test/support/fakes.ts`.

## Ciclo de vida

`enable()` cria a `LauncherSession` e chama `start()`, que registra o atalho com
`Main.wm.addKeybinding`. O mutter relê a chave sozinho quando o atalho muda nas preferências.
`disable()` chama `stop()`, que remove o atalho, destrói a view e solta o sinal do `AppSystem`.

A extensão não mexe em atalho do sistema. O padrão é Super+Alt+Espaço, que o GNOME não usa;
Super+Espaço continua sendo "trocar fonte de entrada".

## Decisões

- Presenter separado da view para poder testar interação sem St. A view só traduz evento em
  chamada (mapa de teclas em `KEY_ACTIONS`).
- Provedores do panorama: o Shell não tem API pública para listar, só `addProvider` e
  `removeProvider`. A lista vem de `Main.overview.searchController._searchResults._providers`
  (campo privado, conferido no Shell 51). Apps e Calculadora ficam de fora porque a extensão
  já cobre os dois (`isCoveredByLauncher`).
- Ações do sistema usam o `misc/systemActions.js` do Shell. Ele já sabe o que está
  disponível agora e casa as palavras-chave traduzidas, então a extensão não mantém lista
  própria.
