$ErrorActionPreference = 'Stop'
$rootPath = [System.IO.Path]::GetFullPath($PSScriptRoot)
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add('http://127.0.0.1:8767/')
try { $listener.Start() } catch { exit 1 }
$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.mp4' = 'video/mp4'
  '.aiff' = 'audio/aiff'
  '.aif' = 'audio/aiff'
  '.wav' = 'audio/wav'
  '.mp3' = 'audio/mpeg'
}
while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    $raw = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/')).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    if ([string]::IsNullOrWhiteSpace($raw)) { $raw = 'index.html' }
    $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootPath, $raw))
    if (-not $filePath.StartsWith($rootPath + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
      $context.Response.StatusCode = 403
    } elseif (-not [System.IO.File]::Exists($filePath)) {
      $context.Response.StatusCode = 404
    } else {
      $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
      if ($mime.ContainsKey($extension)) { $context.Response.ContentType = $mime[$extension] } else { $context.Response.ContentType = 'application/octet-stream' }
      $file = [System.IO.File]::OpenRead($filePath)
      try {
        $first = [long]0
        $last = $file.Length - 1
        $context.Response.AddHeader('Accept-Ranges', 'bytes')
        $range = $context.Request.Headers['Range']
        if ($range -match '^bytes=(\d*)-(\d*)$') {
          if ($Matches[1] -ne '') { $first = [long]$Matches[1] }
          if ($Matches[2] -ne '') { $last = [Math]::Min($last, [long]$Matches[2]) }
          if ($Matches[1] -eq '' -and $Matches[2] -ne '') { $first = [Math]::Max(0, $file.Length - [long]$Matches[2]); $last = $file.Length - 1 }
          if ($first -gt $last -or $first -ge $file.Length) { $context.Response.StatusCode = 416; throw 'Invalid range' }
          $context.Response.StatusCode = 206
          $context.Response.AddHeader('Content-Range', "bytes $first-$last/$($file.Length)")
        }
        $context.Response.ContentLength64 = $last - $first + 1
        $file.Position = $first
        $remaining = $last - $first + 1
        $buffer = New-Object byte[] 65536
        while ($remaining -gt 0) {
          $count = $file.Read($buffer, 0, [int][Math]::Min($buffer.Length, $remaining))
          if ($count -le 0) { break }
          $context.Response.OutputStream.Write($buffer, 0, $count)
          $remaining -= $count
        }
      } finally { $file.Dispose() }
    }
    $context.Response.Close()
  } catch { try { $context.Response.Abort() } catch {} }
}
