# Arc Nova Local Server
# Double-click this file or run: powershell -ExecutionPolicy Bypass -File start-server.ps1

$port    = 3000
$root    = $PSScriptRoot
$prefix  = "http://localhost:$port/"

$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
  '.woff' = 'font/woff'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "ERROR: Could not start server on port $port." -ForegroundColor Red
  Write-Host "Try changing `$port = 3000 to another number (e.g. 8080)." -ForegroundColor Yellow
  Read-Host "Press Enter to exit"
  exit
}

Write-Host ""
Write-Host "  Arc Nova is running!" -ForegroundColor Green
Write-Host "  Open: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

# Auto-open browser
Start-Process "http://localhost:$port"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $urlPath = $req.Url.LocalPath
    if ($urlPath -eq '/' -or $urlPath -eq '') { $urlPath = '/index.html' }

    # Security: block path traversal
    $safePath = $urlPath.TrimStart('/').Replace('/', '\').Replace('..', '')
    $filePath = Join-Path $root $safePath

    if (Test-Path $filePath -PathType Leaf) {
      $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
      $mime = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($filePath)

      $res.ContentType     = $mime
      $res.ContentLength64 = $bytes.Length
      $res.StatusCode      = 200
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $msg   = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $urlPath")
      $res.StatusCode      = 404
      $res.ContentType     = 'text/plain'
      $res.ContentLength64 = $msg.Length
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }

    $res.OutputStream.Close()
  }
} finally {
  $listener.Stop()
  Write-Host "Server stopped." -ForegroundColor Gray
}
