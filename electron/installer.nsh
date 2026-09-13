!include "LogicLib.nsh"

; Sem Function: macros expandem no instalador e no desinstalador (NSIS exige prefixo un. em Function).
; Banco, licença e perfil ficam em $INSTDIR\data. Não grava o .db no AppData.
; Na att, a pasta data é estacionada em $INSTDIR-data-keep (mesmo disco) e volta depois.

!macro CashflowParkInstallData
  ${If} ${FileExists} "$INSTDIR\data"
    RMDir /r "$INSTDIR-data-keep"
    ClearErrors
    Rename "$INSTDIR\data" "$INSTDIR-data-keep"
    ${If} ${Errors}
      CreateDirectory "$INSTDIR-data-keep"
      CopyFiles /SILENT "$INSTDIR\data\*.*" "$INSTDIR-data-keep"
    ${EndIf}
  ${EndIf}
  ${If} ${FileExists} "$INSTDIR\cashflow-desktop.db"
    CreateDirectory "$INSTDIR-data-keep"
    CopyFiles /SILENT "$INSTDIR\cashflow-desktop.db*" "$INSTDIR-data-keep"
  ${EndIf}
  ${If} ${FileExists} "$INSTDIR\license-copy.json"
    CreateDirectory "$INSTDIR-data-keep"
    CopyFiles /SILENT "$INSTDIR\license-copy.json" "$INSTDIR-data-keep\license-copy.json"
  ${EndIf}
  ${If} ${FileExists} "$INSTDIR\.portable"
    CreateDirectory "$INSTDIR-data-keep"
    CopyFiles /SILENT "$INSTDIR\.portable" "$INSTDIR-data-keep\.portable"
  ${EndIf}
!macroend

!macro CashflowRestoreParkedInstallData
  ${If} ${FileExists} "$INSTDIR-data-keep"
    CreateDirectory "$INSTDIR\data"
    CopyFiles /SILENT "$INSTDIR-data-keep\*.*" "$INSTDIR\data"
    ${If} ${FileExists} "$INSTDIR-data-keep\.portable"
      CopyFiles /SILENT "$INSTDIR-data-keep\.portable" "$INSTDIR\.portable"
    ${EndIf}
    ${If} ${FileExists} "$INSTDIR-data-keep\license-copy.json"
      ${If} ${FileExists} "$INSTDIR\data\license-copy.json"
      ${Else}
        CopyFiles /SILENT "$INSTDIR-data-keep\license-copy.json" "$INSTDIR\data\license-copy.json"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

!macro customInit
!macroend

!macro customInstall
  !insertmacro CashflowRestoreParkedInstallData
!macroend

!macro customRemoveFiles
  !insertmacro CashflowParkInstallData
  RMDir /r "$INSTDIR"
!macroend
