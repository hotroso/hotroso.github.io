<div align="center">

# Hotroso DevTools

**Free, privacy-first online developer utilities — QR tools, encoding, escaping, formatting, minifying, and generators running 100% in your browser.**

[![Launch DevTools](https://img.shields.io/badge/Launch-hotroso.github.io-0A66C2?style=flat-square&logo=googlechrome&logoColor=white)](https://hotroso.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-2EA44F?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/Processing-100%25%20Client--Side-1F2328?style=flat-square)](https://hotroso.github.io/)

</div>

---

## Included Tools

All tools are modularly defined in [`features.json`](features.json) and execute entirely client-side with zero backend uploads:

| Category | Tools |
| --- | --- |
| **QR Code** | **QR Generator** (text/URL to PNG) · **QR Files** (camera scanner to reassemble files sent over QR sequences) |
| **Encoding** | **Base64 Encode/Decode** (full UTF-8 & emoji) · **URL Encode/Decode** |
| **Escaping** | **Escape Java/JS** · **Escape HTML** · **Escape XML** · **Escape SQL** · **Escape CSV** |
| **Formatting & Minifying** | **JSON Formatter & Validator** · **JS Minify** (Terser) · **JS Beautify** · **CSS Minify** (CleanCSS) · **CSS Beautify** |
| **Utilities** | **Text Formatter** (case conversion, initials, line wrap) · **Random Generator** (cryptographic passwords, UUID, hex, strings) |

---

## Hotroso Web Ecosystem

A product of **[Hỗ Trợ Giải Pháp Số (Hotroso)](https://github.com/hotroso)**:

| App | Description | Live Site |
| --- | --- | --- |
| **MD Helper** | Local-first browser Markdown editor, Pro WYSIWYG mode, nested folders, Mermaid/KaTeX & Word/PDF/ZIP export | [mdhelper.github.io](https://mdhelper.github.io/) |
| **Âm Lịch Việt Nam** | Offline Vietnamese Lunar–Solar Calendar with Can Chi, auspicious hours & reminders | [amlichvietnam.github.io](https://amlichvietnam.github.io/) |
| **Hỗ Trợ Bản Đồ** | Plot VN2000 & WGS84 land parcel coordinates, measure area/distance & share map links | [hotrobando.github.io](https://hotrobando.github.io/) |
| **Yêu Lịch Sử** | Interactive Vietnamese History Timeline (TimelineJS v3) | [yeulichsu.github.io](https://yeulichsu.github.io/) |
| **Coplay Game** | Face-to-face 2-player split-screen browser games for kids & families | [coplay-game.github.io](https://coplay-game.github.io/) |
| **Truyện Đọc** | Lightweight online web novel reader with light/dark theme | [truyendoc.github.io](https://truyendoc.github.io/) |

---

## Run Locally

No build step or installation required. Clone the repository and serve it with any static HTTP server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## License

Released under the [MIT License](LICENSE).
