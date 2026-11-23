# Regras de busca

## Modos por prefixo (`src/domain/query/queryParser.ts`)

| Prefixo | Modo | O prefixo fica no termo? |
| --- | --- | --- |
| nenhum | padrão: apps, janelas, favoritos, conta automática, ações do sistema, web por último | |
| `=` | calculadora | não |
| `>` | comando no terminal | não |
| `$` | comando em segundo plano | não |
| `?` | web: 10 resultados do DuckDuckGo + linha da busca completa | não |
| `/` ou `~` | arquivos | sim, faz parte do caminho |

Termo vazio não consulta nenhum provedor.

## Notas (0 a 1)

O casamento de texto (`textMatcher.ts`) compara sem acento e sem caixa e usa a primeira
regra que casar: igual (1), prefixo (0,85 a 0,95), início de palavra (0,7 a 0,8), todas as
palavras do termo começando palavras do candidato (0,65), substring (0,5 a 0,6), iniciais
(0,45), letras em ordem (até 0,3). O bônus dentro de cada faixa cresce com a parte do
candidato que o termo cobre, então `fi` dá nota maior para "Files" do que para "Firefox
Developer Edition".

| Provedor | Como pontua |
| --- | --- |
| Apps | Melhor campo ponderado: nome 1, nome genérico e palavras-chave 0,8, executável 0,7, descrição 0,5. 95% da nota vem disso e 5% da frequência de uso (`Shell.AppUsage`), que só desempata |
| Janelas | Título 0,9, nome do app 0,85, vezes 0,95. Fica sempre abaixo do app de mesmo nome |
| Calculadora | 0,97 fixo, aparece no topo |
| Ações do sistema | Nome vezes 0,9, com mínimo de 0,5 (o Shell pode casar só pela palavra-chave) |
| Comandos | 1 |
| Web | 1 com `?`; 0,01 no modo padrão, sempre por último |
| Resultados da web (`?`) | 0,9 caindo 0,01 por posição: ficam na ordem do DuckDuckGo, abaixo da linha da busca completa |
| Atalho de busca (`@y texto`) | 1 |
| Conversão de unidade | 0,97, como a conta |
| Provedores do panorama | 0,6 caindo 0,05 por posição (até 3 por provedor): abaixo de app que casou bem |
| Favoritos | Título 1, domínio do endereço 0,8, vezes 0,9: abaixo do app de mesmo nome. Casamento abaixo de 0,45 (letras soltas em ordem) é descartado, e só os 5 melhores entram |
| Arquivos | Pasta ganha +0,5. O casamento é arredondado em faixas de 0,1, para nomes parecidos empatarem e caírem em ordem alfabética, como num seletor de arquivos |

## Calculadora

- No modo padrão a conta só aparece se o texto tiver dígito E uma operação (operador,
  parêntese ou função). Sem essa regra, digitar `e` procurando o Editor colocaria 2,718 no
  topo.
- `-2^2` é -4 e `2^-1` é 0,5 (potência acima do sinal, associativa à direita).
- `%` divide por 100. `200 * 10%` dá 20. Não existe a regra de calculadora de mesa em que
  `200 + 10%` vira 220.
- O resultado é arredondado a 12 dígitos significativos, o que limpa o ruído binário
  (`0.1 + 0.2` dá `0.3`).
- Divisão por zero, raiz de negativo e fatorial fora de 0 a 170 não geram resultado.
- Limitação conhecida: `1.000` é lido como 1, não como mil. Separador de milhar não existe.

## Conversão de unidade

- Só consulta a Calculadora do GNOME se o texto tem dígito e letra e a calculadora da
  extensão não resolveu. `2 + 2` nunca vai ao D-Bus.
- O texto vai como termos separados por espaço, igual ao panorama, e a resposta usada é o
  `clipboardText` do primeiro resultado (o `open-in-calculator-…` é ignorado).

## Atalhos de busca

- A primeira palavra tem que ser exatamente um atalho configurado (sem diferenciar
  maiúsculas) e precisa vir texto depois. `@y` sozinho não gera linha.
- O texto entra no `%s` do endereço com `encodeURIComponent`.
- No formulário das preferências, atalho não pode ter espaço e o endereço precisa começar
  com `http://` ou `https://` e ter `%s`.

## Favoritos do navegador

- Só o navegador padrão (`Gio.AppInfo.get_default_for_uri_scheme("https")`) e, por enquanto,
  só a família Chromium: Chrome (estável, beta, dev), Chromium, Brave, Edge e Vivaldi. A
  tabela de ids `.desktop` e pastas fica em `src/domain/bookmarks/chromiumBookmarks.ts`.
- Pastas procuradas, nesta ordem: a nativa em `$XDG_CONFIG_HOME`, a do flatpak
  (`~/.var/app/<id>/config/...`) e a do snap. Vale a primeira que tem `Local State`.
- Perfil: `profile.last_used` do `Local State`; sem ele, `Default`. Nome com barra ou `..` é
  ignorado.
- Lê `Bookmarks` (favoritos locais ou da sincronização antiga) E `AccountBookmarks` (conta
  Google conectada sem sincronização, Chrome recente). Junta os dois sem repetir endereço.
- Só endereços `http(s)`: bookmarklet `javascript:` não vira resultado.
- Leitura assíncrona e só de leitura. Cada arquivo fica em memória até a data de modificação
  mudar. Arquivo ausente ou quebrado dá lista vazia, sem erro.
- O Chrome também grava `EncryptedAccountBookmarks2`. Se um dia o `AccountBookmarks` em
  texto sumir, os favoritos da conta param de aparecer: conferir a cada versão do Chrome.
- Firefox (`places.sqlite`) fica para depois: precisa de SQLite, que o GJS não garante.
- Vem desligado (opt-in): a extensão só lê os favoritos depois que o usuário liga em
  Preferências > Buscar nos favoritos do navegador (`search-bookmarks`).

## Comandos

- `>` monta `<terminal> <args> sh -c '<comando>; exec "${SHELL:-sh}"'`. O shell no fim mantém
  a janela aberta.
- O terminal vem de `org.gnome.desktop.default-applications.terminal`. Se o binário
  configurado não existir, usa o primeiro disponível de: xdg-terminal-exec, ptyxis, kgx,
  gnome-terminal, konsole, kitty, alacritty, foot, wezterm, xterm.
- Sem terminal nenhum, aparece a notificação de erro "Não foi possível abrir o resultado".

## Arquivos

- `~` sozinho lista o home. Barra no fim lista a pasta inteira.
- Arquivo escondido só aparece se o trecho digitado começar com ponto.
- Lê no máximo 500 itens da pasta, de forma assíncrona.
- Tab completa com o caminho (pasta ganha a barra final), Enter abre no app padrão.

## Captura do atalho nas preferências

Esc cancela, Backspace deixa sem atalho, tecla modificadora sozinha espera a próxima tecla.
Letra sem Super, Ctrl ou Alt é recusada (Shift sozinho só faz maiúscula). Tecla de função
sozinha (F1 a F12) vale.
