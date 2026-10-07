# Device Permissions

PROMETHEUS should request the minimum permissions required for the current feature.

| Capability | Core requirement | Preferred mechanism |
|---|---|---|
| Network | Yes for public source/update access | Android/iOS network stack |
| User-selected files | Optional | System document/file picker |
| Notifications | Optional | User-controlled notification permission |
| Camera | No | Do not request unless a future feature needs it |
| Microphone | No | Do not request |
| Location | No | Do not request |
| Contacts | No | Do not request |
| SMS/call logs | No | Do not request |
| Broad storage access | No | Use system picker |

Permission requests must occur in context, explain the purpose, and respect denial.
