!include "LogicLib.nsh"

; Sem Function: macros expandem no instalador e no desinstalador (NSIS exige prefixo un. em Function).

!macro CashflowReadDbSize outVar file
  Push $9
  ClearErrors
  FileOpen $9 "${file}" r
  ${If} ${Errors}
    StrCpy ${outVar} 0
  ${Else}
    FileSeek $9 0 END ${outVar}
    FileClose $9
  ${EndIf}
  Pop $9
!macroend

!macro CashflowTrySource path
  ${If} ${FileExists} "${path}\cashflow-desktop.db"
    !insertmacro CashflowReadDbSize $R3 "${path}\cashflow-desktop.db"
    ${If} $R3 > $R4
      StrCpy $R5 "${path}"
      StrCpy $R4 $R3
    ${EndIf}
  ${EndIf}
!macroend

!macro CashflowBackupAppData
  StrCpy $R8 "$APPDATA\${PRODUCT_NAME}"
  StrCpy $R9 "$R8\cashflow-desktop.db"
  CreateDirectory "$LOCALAPPDATA\CashflowInstallBackup"
  ${If} ${FileExists} $R9
    CopyFiles /SILENT "$R9" "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.last.db"
    CopyFiles /SILENT "$R8\cashflow-desktop.db*" "$LOCALAPPDATA\CashflowInstallBackup"
  ${EndIf}
!macroend

!macro customInit
  !insertmacro CashflowBackupAppData

  StrCpy $R8 "$APPDATA\${PRODUCT_NAME}"
  StrCpy $R9 "$R8\cashflow-desktop.db"
  StrCpy $R5 ""
  StrCpy $R4 0

  ${If} ${FileExists} $R9
    !insertmacro CashflowReadDbSize $R4 $R9
  ${EndIf}

  !insertmacro CashflowTrySource "$INSTDIR\data"
  !insertmacro CashflowTrySource "$INSTDIR"

  ReadRegStr $R6 HKCU "Software\${APP_GUID}" InstallLocation
  ${If} $R6 != ""
    !insertmacro CashflowTrySource "$R6\data"
    !insertmacro CashflowTrySource "$R6"
  ${EndIf}

  ReadRegStr $R6 HKLM "Software\${APP_GUID}" InstallLocation
  ${If} $R6 != ""
    !insertmacro CashflowTrySource "$R6\data"
    !insertmacro CashflowTrySource "$R6"
  ${EndIf}

  !insertmacro CashflowTrySource "$LOCALAPPDATA\Programs\${PRODUCT_NAME}\data"
  !insertmacro CashflowTrySource "$LOCALAPPDATA\Programs\Cashflow Pro\data"
  !insertmacro CashflowTrySource "$LOCALAPPDATA\Programs\Cashflow Pessoal\data"
  !insertmacro CashflowTrySource "D:\cashflow\Cashflow Pro\data"
  !insertmacro CashflowTrySource "D:\cashflow\Cashflow Pessoal\data"
  !insertmacro CashflowTrySource "D:\cashflow\Cashflow Pro"
  !insertmacro CashflowTrySource "$LOCALAPPDATA\CashflowInstallBackup"

  ${If} $R5 != ""
    CreateDirectory "$R8"
    CopyFiles /SILENT "$R5\cashflow-desktop.db*" "$R8"
    CopyFiles /SILENT "$R5\cashflow-desktop.db*" "$LOCALAPPDATA\CashflowInstallBackup"
  ${EndIf}
!macroend

!macro customInstall
  !insertmacro CashflowBackupAppData
  ${If} ${FileExists} "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.last.db"
    StrCpy $R8 "$APPDATA\${PRODUCT_NAME}"
    CreateDirectory "$R8"
    !insertmacro CashflowReadDbSize $R3 "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.last.db"
    StrCpy $R4 0
    ${If} ${FileExists} "$R8\cashflow-desktop.db"
      !insertmacro CashflowReadDbSize $R4 "$R8\cashflow-desktop.db"
    ${EndIf}
    ${If} $R3 > $R4
      CopyFiles /SILENT "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.last.db" "$R8\cashflow-desktop.db"
    ${EndIf}
  ${EndIf}
  ${If} ${FileExists} "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.db"
    StrCpy $R8 "$APPDATA\${PRODUCT_NAME}"
    CreateDirectory "$R8"
    !insertmacro CashflowReadDbSize $R3 "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.db"
    StrCpy $R4 0
    ${If} ${FileExists} "$R8\cashflow-desktop.db"
      !insertmacro CashflowReadDbSize $R4 "$R8\cashflow-desktop.db"
    ${EndIf}
    ${If} $R3 > $R4
      CopyFiles /SILENT "$LOCALAPPDATA\CashflowInstallBackup\cashflow-desktop.db" "$R8\cashflow-desktop.db"
    ${EndIf}
  ${EndIf}
!macroend

!macro customRemoveFiles
  !insertmacro CashflowBackupAppData
  ${If} ${FileExists} "$INSTDIR\data\cashflow-desktop.db"
    StrCpy $R8 "$APPDATA\${PRODUCT_NAME}"
    CreateDirectory "$R8"
    CreateDirectory "$LOCALAPPDATA\CashflowInstallBackup"
    CopyFiles /SILENT "$INSTDIR\data\cashflow-desktop.db*" "$LOCALAPPDATA\CashflowInstallBackup"
    !insertmacro CashflowReadDbSize $R3 "$INSTDIR\data\cashflow-desktop.db"
    StrCpy $R4 0
    ${If} ${FileExists} "$R8\cashflow-desktop.db"
      !insertmacro CashflowReadDbSize $R4 "$R8\cashflow-desktop.db"
    ${EndIf}
    ${If} $R3 > $R4
      CopyFiles /SILENT "$INSTDIR\data\cashflow-desktop.db*" "$R8"
    ${EndIf}
  ${EndIf}
  ${If} ${FileExists} "$INSTDIR\cashflow-desktop.db"
    CreateDirectory "$LOCALAPPDATA\CashflowInstallBackup"
    CopyFiles /SILENT "$INSTDIR\cashflow-desktop.db*" "$LOCALAPPDATA\CashflowInstallBackup"
  ${EndIf}
  RMDir /r "$INSTDIR"
!macroend
