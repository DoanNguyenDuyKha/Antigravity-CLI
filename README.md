# BigQuery Release Radar ⚡

A premium, high-fidelity web application built with Python Flask and vanilla HTML, JavaScript, and CSS that tracks, filters, and shares BigQuery release notes in real time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue.svg)
![Flask](https://img.shields.io/badge/flask-3.1.3%2B-green.svg)

---

## ✨ Features

* **🔄 Live Syncing**: Pulls and caches the latest official Google Cloud BigQuery RSS feed (`bigquery-release-notes.xml`) in real time.
* **🔍 Search & Filter**: Instant search capabilities to query release logs (e.g., *Gemini*, *JSON*, *partition*) and filter them by category badges (**Features**, **Changes**, **Issues**, **Deprecations**).
* **🎯 Interactive Selection**: Multi-card styling with glowing outlines and checkboxes to select and focus on specific updates.
* **🐦 X/Twitter Composer Integration**: Click to share updates instantly to X/Twitter. Features a built-in smart truncation algorithm that calculates Twitter's strict 280-character limit (accounting for standard link wrapping and hashtags) before composing the tweet.
* **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop screens with a beautiful glassmorphic dark theme and micro-animations.

---

## 🛠️ Tech Stack

* **Backend**: Python Flask, Requests, standard `ElementTree` XML parser.
* **Frontend**: Vanilla HTML5, Vanilla CSS3 (custom CSS variables & gradients), Vanilla JavaScript (ES6+).
* **Typography & Icons**: Google Fonts (Outfit, JetBrains Mono), FontAwesome 6.4.0.

---

## 📂 Project Structure

```plaintext
agy-cli-projects/
├── .gitignore          # Git ignore patterns for venv, cache, and OS files
├── app.py              # Flask server, RSS parser, caching, and API endpoints
├── requirements.txt    # Python dependencies
├── README.md           # Project documentation
├── templates/
│   └── index.html      # Main dashboard HTML template
└── static/
    ├── style.css       # Custom design system, badges, and responsive layout
    └── script.js       # Feed fetching, filtering, card selection, and Tweet composer logic
```

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/DoanNguyenDuyKha/Antigravity-CLI.git
cd Antigravity-CLI
```

### 2. Set up the virtual environment
Create a virtual environment and activate it:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the server
Start the Flask application:
```bash
python app.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
