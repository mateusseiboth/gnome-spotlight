# Regras de busca

## Modos por prefixo (`src/domain/query/queryParser.ts`)

| Prefixo | Modo | O prefixo fica no termo? |
| --- | --- | --- |
| nenhum | padrão: apps, janelas, conta automática, ações do sistema, web por último | |
| `=` | calculadora | não |
| `>` | comando no terminal | não |
| `$` | comando em segundo plano | não |
| `?` | web | não |
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

## Atalho em conflito

- Candidatos a conflito: `org.gnome.desktop.wm.keybindings switch-input-source`.
- Ao liberar, grava `{schema, key, accelerator, index}` em `released-keybindings`.
- Ao restaurar, devolve na posição original e não duplica se o usuário já tiver devolvido.
- Registro corrompido vale como vazio.
- Trocar o atalho nas preferências devolve o liberado antes e libera o novo.

## Captura do atalho nas preferências

Esc cancela, Backspace deixa sem atalho, tecla modificadora sozinha espera a próxima tecla.
Letra sem Super, Ctrl ou Alt é recusada (Shift sozinho só faz maiúscula). Tecla de função
sozinha (F1 a F12) vale.
