$ErrorActionPreference = "Stop"

$secureToken = Read-Host "Nhap token moi cua bot (input se duoc an)" -AsSecureString
$tokenPointer = [IntPtr]::Zero
$token = $null

try {
  $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)

  Write-Host "Trong 2 phut toi, hay gui @little_cooper_bot trong topic can nhan tin."
  $deadline = [DateTime]::UtcNow.AddMinutes(2)
  $offset = $null
  $matchedMessage = $null

  while ([DateTime]::UtcNow -lt $deadline -and -not $matchedMessage) {
    $uri = "https://api.telegram.org/bot$token/getUpdates?timeout=20"
    if ($null -ne $offset) {
      $uri += "&offset=$offset"
    }

    $response = Invoke-RestMethod -Uri $uri -Method Get -TimeoutSec 30
    if (-not $response.ok) {
      throw "Telegram API tu choi yeu cau: $($response.description)"
    }

    foreach ($update in $response.result) {
      $nextOffset = [long]$update.update_id + 1
      if ($null -eq $offset -or $nextOffset -gt $offset) {
        $offset = $nextOffset
      }

      $message = $update.message
      if (-not $message) { $message = $update.edited_message }
      if (-not $message) { $message = $update.channel_post }
      if (-not $message) { continue }

      $text = $message.text
      if (-not $text) { $text = $message.caption }
      if ($text -and $text -match '(?i)@little_cooper_bot\b') {
        $matchedMessage = $message
        break
      }
    }

    if (-not $matchedMessage) {
      Write-Host "Chua thay tin tag, dang doi tiep..." -ForegroundColor Yellow
    }
  }

  if (-not $matchedMessage) {
    Write-Host "Het 2 phut nhung chua nhan duoc tin tag bot." -ForegroundColor Red
    Write-Host "Kiem tra bot da duoc them vao group, gui tag trong topic, roi chay lai."
    exit 1
  }

  $message = $matchedMessage
  if (-not $message.message_thread_id) {
    Write-Host "Tin nhan co tag bot nhung khong co message_thread_id." -ForegroundColor Red
    Write-Host "Hay gui tag trong topic forum, khong gui o luong chat chung."
    exit 1
  }

  Write-Host ""
  Write-Host "Da tim thay topic Telegram:" -ForegroundColor Green
  Write-Host "Group: $($message.chat.title)"
  Write-Host "TELEGRAM_CHAT_ID=$($message.chat.id)"
  Write-Host "TELEGRAM_MESSAGE_THREAD_ID=$($message.message_thread_id)"
  Write-Host ""
  Write-Host "Them hai ID nay vao Supabase Edge Functions Secrets:"
  Write-Host "TELEGRAM_CHAT_ID va TELEGRAM_MESSAGE_THREAD_ID"
}
catch {
  Write-Host "Khong lay duoc ID: $($_.Exception.Message)" -ForegroundColor Red
  Write-Host "Neu Telegram bao conflict, bot dang dung webhook Telegram va getUpdates khong the chay cung luc."
  exit 1
}
finally {
  if ($tokenPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  }
  $token = $null
  $secureToken = $null
}
