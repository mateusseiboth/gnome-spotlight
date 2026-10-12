# Arquitetura

## Fluxo de uma busca

1. `SpotlightOverlay` (St) recebe o texto da caixa e chama `SpotlightPresenter.onQueryChanged`.
2. O presenter pede um token ao `LatestRequestGate` e chama `SearchService.search`.
3. O serviço lê o modo com `parseQuery` (prefixo), filtra os provedores que atendem o modo e
   consulta todos em paralelo com `Promise.allSettled`.
4. Junta os resultados, mantém o de maior nota quando dois têm o mesmo `id`, ordena por nota
   e depois por título, corta no limite das preferências.
5. Se o token ainda é o mais novo, o presenter manda a view desenhar. Resposta atrasada
   (pasta lenta) é descartada.
6. Enter ou clique: o presenter FECHA a janela e só depois chama `result.activate()`. Fechar
   antes devolve o foco às janelas, senão o app recém-aberto nasce atrás.

## Camadas

| Pasta | Papel | Pode importar valor de `gi://`? |
| --- | --- | --- |
| `src/domain` | Regras puras: casamento de texto, calculadora, caminhos, terminal, atalho | Não |
| `src/service` | `SearchService`, `KeybindingConflictService` | Não |
| `src/provider` | Uma strategy por fonte de resultado + a factory | Não |
| `src/ui/spotlightPresenter.ts` | Interação (setas, Enter, Tab, Esc) | Não |
| `src/ui` (resto) | View St | Sim |
| `src/infra/gnome` | Adaptadores das portas (`AppCatalog`, `WindowCatalog`...) | Sim |
| `src/app` | `SpotlightSession`, a raiz de composição | Sim |
| `src/prefs` | Linha de captura de atalho (GTK 4) | Sim |

As portas ficam em `src/domain/*/…Ports.ts`. Cada adaptador do Shell implementa uma.
Os testes usam portas falsas em `test/support/fakes.ts`.

## Ciclo de vida

`enable()` cria a `SpotlightSession` e chama `start()`: libera o atalho em conflito, registra
o atalho com `Main.wm.addKeybinding` e passa a ouvir mudanças do atalho. `disable()` chama
`stop()`, que remove o atalho, destrói a view, solta o sinal do `AppSystem` e devolve o
atalho liberado.

## Decisões

- Presenter separado da view para poder testar interação sem St. A view só traduz evento em
  chamada (mapa de teclas em `KEY_ACTIONS`).
- O registro do atalho liberado fica em GSettings (`released-keybindings`), não em memória.
  Se o Shell cair com a extensão ativa, o próximo `disable()` ainda sabe o que devolver.
- Ações do sistema usam o `misc/systemActions.js` do Shell. Ele já sabe o que está
  disponível agora e casa as palavras-chave traduzidas, então a extensão não mantém lista
  própria.
