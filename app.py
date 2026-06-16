from flask import Flask, jsonify, render_template, request
import requests
import xml.etree.ElementTree as ET
import re
import time

app = Flask(__name__)

# In-memory cache for feed data
FEED_CACHE = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 600  # 10 minutes cache

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
NAMESPACE = {"atom": "http://www.w3.org/2005/Atom"}

def parse_xml_feed(xml_content):
    """
    Parses the BigQuery Release Notes XML feed and extracts structured release notes.
    """
    root = ET.fromstring(xml_content)
    parsed_entries = []

    for entry in root.findall("atom:entry", NAMESPACE):
        title = entry.find("atom:title", NAMESPACE)
        date_str = title.text.strip() if title is not None else "Unknown Date"
        
        updated = entry.find("atom:updated", NAMESPACE)
        updated_str = updated.text.strip() if updated is not None else ""
        
        link = entry.find("atom:link[@rel='alternate']", NAMESPACE)
        if link is None:
            link = entry.find("atom:link", NAMESPACE)
        link_str = link.attrib.get("href", "").strip() if link is not None else ""
        
        id_element = entry.find("atom:id", NAMESPACE)
        id_str = id_element.text.strip() if id_element is not None else ""

        content_element = entry.find("atom:content", NAMESPACE)
        html_content = content_element.text.strip() if content_element is not None else ""

        # Parse the HTML content to split into individual updates (by h3 tags)
        pattern = r"<h3>(.*?)</h3>(.*?)(?=<h3>|$)"
        matches = re.findall(pattern, html_content, re.DOTALL)
        
        updates = []
        for type_name, body in matches:
            type_name = type_name.strip()
            body = body.strip()
            # Clean up the body html: replace double newlines, trim, etc.
            body = re.sub(r'\n+', '\n', body)
            
            # Create a plain-text version of the update body for Tweeting
            # Remove HTML tags
            plain_text = re.sub(r"<[^>]+>", "", body).strip()
            # Normalize whitespace
            plain_text = " ".join(plain_text.split())
            
            updates.append({
                "type": type_name,
                "html": body,
                "text": plain_text
            })

        # Fallback if no <h3> tags were found in the entry
        if not updates and html_content:
            plain_text = re.sub(r"<[^>]+>", "", html_content).strip()
            plain_text = " ".join(plain_text.split())
            updates.append({
                "type": "Update",
                "html": html_content,
                "text": plain_text
            })

        parsed_entries.append({
            "id": id_str,
            "date": date_str,
            "updated": updated_str,
            "link": link_str,
            "updates": updates
        })

    return parsed_entries

def fetch_feed_data(force=False):
    """
    Fetches feed data either from cache or by requesting the live RSS feed.
    """
    current_time = time.time()
    
    if not force and FEED_CACHE["data"] and (current_time - FEED_CACHE["last_fetched"] < CACHE_DURATION):
        return FEED_CACHE["data"], "cache"

    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        parsed_data = parse_xml_feed(response.content)
        
        # Update cache
        FEED_CACHE["data"] = parsed_data
        FEED_CACHE["last_fetched"] = current_time
        return parsed_data, "live"
    except Exception as e:
        # If live fetch fails but we have cached data, fallback to cache
        if FEED_CACHE["data"]:
            return FEED_CACHE["data"], "fallback"
        raise e

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/notes")
def get_notes():
    # Allow forcing a refresh using /api/notes?refresh=true
    force_refresh = request.args.get("refresh", "false").lower() == "true"
    try:
        data, source = fetch_feed_data(force=force_refresh)
        return jsonify({
            "status": "success",
            "source": source,
            "count": len(data),
            "data": data
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
