# Testes

## Unitários

`bun test` cobre domínio, serviços, provedores, factory, presenter, CSS e o catálogo de
tradução. Tudo sem GNOME, com portas falsas (`test/support/fakes.ts`). Arquivo novo segue
`<assunto>.unit.test.ts`.

## Shell real, sem mexer na sessão

Dá para subir um gnome-shell isolado e ver se a extensão ativa sem erro:

```bash
export XDG_DATA_HOME=$(mktemp -d) XDG_CONFIG_HOME=$(mktemp -d) XDG_CACHE_HOME=$(mktemp -d)
export XDG_RUNTIME_DIR=/tmp/gsrt GSETTINGS_BACKEND=memory   # caminho curto, ver abaixo
mkdir -p $XDG_RUNTIME_DIR $XDG_DATA_HOME/gnome-shell/extensions && chmod 700 $XDG_RUNTIME_DIR
cp -r dist $XDG_DATA_HOME/gnome-shell/extensions/gnome-spotlight@mateusseiboth.github.io
dbus-run-session -- sh -c 'gnome-shell --headless --wayland --no-x11 --virtual-monitor 1600x1000 & \
  gdbus wait --session --timeout 40 org.gnome.Shell; \
  gnome-extensions enable gnome-spotlight@mateusseiboth.github.io; \
  gnome-extensions info gnome-spotlight@mateusseiboth.github.io; wait'
```

- `GSETTINGS_BACKEND=memory` impede que o shell de teste grave no dconf da sessão real. Sem
  isso, ativar a extensão ali tiraria o Super+Espaço da sua sessão de verdade.
- O socket Wayland (`$XDG_RUNTIME_DIR/wayland-0`) tem limite de 108 bytes de caminho. Com
  `XDG_RUNTIME_DIR` comprido o mutter aborta com "Failed to create socket".
- Para abrir as preferências dentro desse shell:
  `dbus-update-activation-environment WAYLAND_DISPLAY=wayland-0 ...` e depois
  `gnome-extensions prefs <uuid>`. Só uma janela de preferências por vez.
- Captura de tela e `Eval` pelo D-Bus exigem `unsafe_mode`, que não é ligado. A verificação
  visual é feita na sessão real, depois de logout e login.

Resultado em 12/10/2026: estado `ACTIVE`, três ciclos de desativar e reativar sem erro no log,
preferências abrindo sem erro de JS.
