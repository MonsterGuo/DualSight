; electron-builder NSIS hooks: force the Windows shell to refresh its
; icon cache after install/uninstall. Without this, replacing the exe at
; the same path leaves Explorer showing the previous (cached) icon on the
; desktop/start-menu shortcuts.
!macro customInstall
  nsExec::ExecToLog '"$WINDIR\system32\ie4uinit.exe" -ClearIconCache'
  nsExec::ExecToLog '"$WINDIR\system32\ie4uinit.exe" -show'
!macroend

!macro customUnInstall
  nsExec::ExecToLog '"$WINDIR\system32\ie4uinit.exe" -ClearIconCache'
  nsExec::ExecToLog '"$WINDIR\system32\ie4uinit.exe" -show'
!macroend
