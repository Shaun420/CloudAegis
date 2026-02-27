# CloudAegis
Secure Private File Storage

| Module | Description |
| :---: | :--- |
| Backend | Node.js + Express |
| Encryption | AES-256-GCM for files, TLS 1.3 for transport |
| Storage | Local filesystem (encrypted) |
| Auth | Custom header validation middleware |
| Frontend | Vanilla HTML/CSS/JS |

## Windows Setup
Run PowerShell as Administrator
```code
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Navigate to project
```code
cd C:\path\to\cloudaegis
```

Run setup
```code
.\scripts\windows-setup.ps1
```