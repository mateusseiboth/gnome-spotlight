// Ambiente do GJS e do GNOME Shell 50 (`global`, `resource:///org/gnome/shell/...`).
// SÓ no projeto de src: o `global` do Shell colide com o `global` do Node que o
// `@types/bun` declara para os testes.
import "@girs/gjs";
import "@girs/gjs/dom";
import "@girs/gnome-shell/ambient";
import "@girs/gnome-shell/extensions/global";
