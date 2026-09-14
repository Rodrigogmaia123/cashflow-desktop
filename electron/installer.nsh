!include "LogicLib.nsh"

; Banco só em $INSTDIR\data. O app não procura em AppData nem em outro disco.
; Na att: tira a pasta data para o lado (mesmo disco) e devolve depois — o mesmo .db.

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
      CopyFiles /SILENT "$INSTDIR-data-keep\license-copy.json" "$INSTDIR\data\license-copy.json"
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
