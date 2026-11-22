# Memories Gallery — two-repository update

## Frontend
Set `API` in `app.js` to your authenticated API/Worker URL. `REPOSITORIES` is configured for `memories-archive-001` and `memories-archive-002`. The UI contains only **Photos** and **Videos** tabs. It never lists individual folders or media filenames.

## Backend requirement
Private repositories cannot be scanned securely from GitHub Pages JavaScript. The authenticated backend must verify the GitHub account is `SadGuy0`, then recursively scan each configured repository using GitHub's Git Trees API (`recursive=1`; traverse subtrees if GitHub marks the response as truncated). Keep blobs classified by image/video extension or MIME type and return paginated results. Proxy media bytes through authenticated endpoints; never expose a GitHub token in frontend code.

The frontend expects:
- `GET /api/media?kind=photo|video&repos=memories-archive-001,memories-archive-002&year=&month=&repo=&cursor=&limit=60`
- `GET /api/years?repos=...`
- `GET /api/me`
- `GET /api/image?repo=...&path=...` (image/thumbnail bytes)
- `GET /api/video?repo=...&path=...` (video bytes; support HTTP Range for seeking)
- `GET /auth/login` and `POST /auth/logout`

Media response: `{"items":[{"id":"...","repo":"memories-archive-001","path":"2024/01/01/photo.jpg","kind":"photo","date":"2024-01-01","year":"2024","month":"01"}],"nextCursor":null}`.

This ZIP updates the frontend configuration/request only. It does not include your authenticated backend. If the current backend hardcodes folders, replace that logic with the recursive Git Trees scan. Never put a PAT, OAuth secret, or private token in `app.js`.
