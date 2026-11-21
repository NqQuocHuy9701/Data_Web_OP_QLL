$ErrorActionPreference = "Stop"

$chatId = "-1002475140483"
$messageThreadId = 33200
$secureToken = Read-Host "Nhap token moi cua bot (input se duoc an)" -AsSecureString
$tokenPointer = [IntPtr]::Zero
$token = $null

try {
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)

  $body = @{
    chat_id = $chatId
    message_thread_id = $messageThreadId
    text = "TEST: Telegram bot connected to the Add Lop group topic."
  } | ConvertTo-Json

  $response = Invoke-RestMethod `
    -Uri "https://api.telegram.org/bot$token/sendMessage" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
    -TimeoutSec 30

  if (-not $response.ok) {
    throw "Telegram API tu choi yeu cau."
  }

  Write-Host "Gui tin test thanh cong." -ForegroundColor Green
  Write-Host "Chat ID Telegram xac nhan: $($response.result.chat.id)"
  Write-Host "Topic ID Telegram xac nhan: $($response.result.message_thread_id)"
  Write-Host "Message ID: $($response.result.message_id)"
}
catch {
  $description = $_.ErrorDetails.Message
  if ($description) {
    try {
      $telegramError = $description | ConvertFrom-Json
      if ($telegramError.description) {
        $description = $telegramError.description
      }
    } catch {
      $description = "Telegram khong chap nhan yeu cau."
    }
  } else {
    $description = "Khong the ket noi Telegram hoac token khong hop le."
  }

  Write-Host "Gui tin test that bai: $description" -ForegroundColor Red
  exit 1
}
finally {
  if ($tokenPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  }
  $token = $null
  $secureToken = $null
}
