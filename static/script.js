document.addEventListener("DOMContentLoaded", () => {
    // State management
    let releaseNotes = [];
    let selectedUpdateId = null; // Stores currently selected update card unique ID
    let currentFilterType = "all";
    let searchQuery = "";

    // DOM Elements
    const btnRefresh = document.getElementById("btn-refresh");
    const refreshIcon = document.getElementById("refresh-icon");
    const lastUpdatedText = document.getElementById("last-updated-text");
    const lastUpdatedDot = document.querySelector(".last-updated-badge .dot");
    const searchInput = document.getElementById("search-input");
    const clearSearchBtn = document.getElementById("clear-search");
    const filterPills = document.getElementById("filter-pills");
    const notesFeed = document.getElementById("notes-feed");
    const loadingState = document.getElementById("loading-state");
    const errorState = document.getElementById("error-state");
    const errorMessage = document.getElementById("error-message");
    const btnRetry = document.getElementById("btn-retry");
    const emptyState = document.getElementById("empty-state");
    const btnResetFilters = document.getElementById("btn-reset-filters");
    const btnExportCsv = document.getElementById("btn-export-csv");

    // Selection Bar Elements
    const selectionBar = document.getElementById("selection-bar");
    const selectionCount = document.getElementById("selection-count");
    const btnClearSelection = document.getElementById("btn-clear-selection");
    const btnTweetSelected = document.getElementById("btn-tweet-selected");

    // Tweet Modal Elements
    const tweetModal = document.getElementById("tweet-modal");
    const closeModal = document.getElementById("close-modal");
    const btnCancelTweet = document.getElementById("btn-cancel-tweet");
    const btnPublishTweet = document.getElementById("btn-publish-tweet");
    const tweetTextarea = document.getElementById("tweet-textarea");
    const charCounter = document.getElementById("char-counter");
    const modalBadge = document.getElementById("modal-badge");
    const modalDate = document.getElementById("modal-date");
    const modalSourceText = document.getElementById("modal-source-text");
    const limitWarning = document.getElementById("limit-warning");

    // Initialize the app
    fetchReleaseNotes();

    // Event Listeners
    btnRefresh.addEventListener("click", () => fetchReleaseNotes(true));
    btnRetry.addEventListener("click", () => fetchReleaseNotes(true));
    btnExportCsv.addEventListener("click", exportFilteredNotesToCSV);
    
    // Search input
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        renderFeed();
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        toggleClearSearchButton();
        renderFeed();
        searchInput.focus();
    });

    function toggleClearSearchButton() {
        if (searchQuery.length > 0) {
            clearSearchBtn.style.display = "block";
        } else {
            clearSearchBtn.style.display = "none";
        }
    }

    // Filter pills
    filterPills.addEventListener("click", (e) => {
        const pill = e.target.closest(".pill");
        if (!pill) return;

        // Update active class
        document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");

        currentFilterType = pill.dataset.type;
        renderFeed();
    });

    // Reset filters
    btnResetFilters.addEventListener("click", resetFilters);

    function resetFilters() {
        searchInput.value = "";
        searchQuery = "";
        toggleClearSearchButton();

        document.querySelectorAll(".pill").forEach(p => {
            if (p.dataset.type === "all") {
                p.classList.add("active");
            } else {
                p.classList.remove("active");
            }
        });
        currentFilterType = "all";
        renderFeed();
    }

    // Selection Bar actions
    btnClearSelection.addEventListener("click", clearSelection);

    btnTweetSelected.addEventListener("click", () => {
        if (!selectedUpdateId) return;
        const [entryIndex, updateIndex] = selectedUpdateId.split("-").map(Number);
        const entry = releaseNotes[entryIndex];
        const update = entry.updates[updateIndex];
        openTweetComposer(entry, update);
    });

    // Modal close actions
    closeModal.addEventListener("click", closeTweetComposer);
    btnCancelTweet.addEventListener("click", closeTweetComposer);
    tweetModal.addEventListener("click", (e) => {
        if (e.target === tweetModal) closeTweetComposer();
    });

    // Character counter for Twitter
    tweetTextarea.addEventListener("input", () => {
        updateCharCount();
    });

    // Publish tweet
    btnPublishTweet.addEventListener("click", () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, "_blank", "noopener,noreferrer");
        closeTweetComposer();
    });

    // Fetch API implementation
    async function fetchReleaseNotes(force = false) {
        showLoading();
        clearSelection();

        try {
            const url = force ? "/api/notes?refresh=true" : "/api/notes";
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === "success") {
                releaseNotes = result.data;
                updateLastUpdatedTimestamp(result.source);
                renderFeed();
            } else {
                showError(result.message || "Failed to load release notes from API.");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            showError("Network connection error. Please check if the backend is running.");
        }
    }

    function showLoading() {
        loadingState.style.display = "flex";
        errorState.style.display = "none";
        emptyState.style.display = "none";
        notesFeed.style.display = "none";
        
        btnRefresh.disabled = true;
        btnExportCsv.disabled = true;
        refreshIcon.classList.add("spinning");
        lastUpdatedDot.classList.add("syncing");
        lastUpdatedText.textContent = "Syncing feed...";
    }

    function showError(msg) {
        loadingState.style.display = "none";
        notesFeed.style.display = "none";
        emptyState.style.display = "none";
        
        errorState.style.display = "flex";
        errorMessage.textContent = msg;

        btnRefresh.disabled = false;
        btnExportCsv.disabled = true;
        refreshIcon.classList.remove("spinning");
        lastUpdatedDot.classList.remove("syncing");
        lastUpdatedDot.style.backgroundColor = "var(--color-deprecation)";
        lastUpdatedDot.style.boxShadow = "0 0 8px var(--color-deprecation)";
        lastUpdatedText.textContent = "Sync failed";
    }

    function updateLastUpdatedTimestamp(source) {
        btnRefresh.disabled = false;
        btnExportCsv.disabled = false;
        refreshIcon.classList.remove("spinning");
        lastUpdatedDot.classList.remove("syncing");
        
        lastUpdatedDot.style.backgroundColor = "var(--color-feature)";
        lastUpdatedDot.style.boxShadow = "0 0 8px var(--color-feature)";
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        if (source === "cache") {
            lastUpdatedText.textContent = `Cached (Synced ${timeStr})`;
        } else if (source === "live") {
            lastUpdatedText.textContent = `Live Synced (${timeStr})`;
        } else {
            lastUpdatedText.textContent = `Synced (${timeStr})`;
        }
    }

    // Render logic
    function renderFeed() {
        loadingState.style.display = "none";
        errorState.style.display = "none";
        
        notesFeed.innerHTML = "";
        
        let visibleEntriesCount = 0;

        releaseNotes.forEach((entry, entryIdx) => {
            // Filter updates within this entry
            const filteredUpdates = entry.updates.map((update, updateIdx) => ({
                ...update,
                originalIndex: updateIdx,
                id: `${entryIdx}-${updateIdx}`
            })).filter(update => {
                // Type filter
                const matchesType = currentFilterType === "all" || update.type.toLowerCase() === currentFilterType;
                
                // Search filter
                const matchesSearch = searchQuery === "" || 
                    update.type.toLowerCase().includes(searchQuery) ||
                    update.text.toLowerCase().includes(searchQuery) ||
                    entry.date.toLowerCase().includes(searchQuery);

                return matchesType && matchesSearch;
            });

            if (filteredUpdates.length > 0) {
                visibleEntriesCount++;
                
                // Create Date Group Element
                const dateGroup = document.createElement("div");
                dateGroup.className = "date-group";

                // Date Header
                const dateHeader = document.createElement("div");
                dateHeader.className = "date-header";
                
                const heading = document.createElement("h2");
                heading.textContent = entry.date;
                
                const line = document.createElement("div");
                line.className = "date-line";

                const orgLink = document.createElement("a");
                orgLink.className = "original-link";
                orgLink.href = entry.link || "#";
                orgLink.target = "_blank";
                orgLink.rel = "noopener noreferrer";
                orgLink.innerHTML = 'Docs <i class="fa-solid fa-up-right-from-square"></i>';

                dateHeader.appendChild(heading);
                dateHeader.appendChild(line);
                dateHeader.appendChild(orgLink);
                dateGroup.appendChild(dateHeader);

                // Cards Grid
                const grid = document.createElement("div");
                grid.className = "update-cards-grid";

                filteredUpdates.forEach(update => {
                    const card = document.createElement("div");
                    card.className = "update-card";
                    card.dataset.id = update.id;
                    if (selectedUpdateId === update.id) {
                        card.classList.add("selected");
                    }

                    // Card Header Row
                    const cardTop = document.createElement("div");
                    cardTop.className = "card-top";

                    const badge = document.createElement("span");
                    const typeClass = update.type.toLowerCase();
                    badge.className = `badge ${typeClass}`;
                    badge.textContent = update.type;

                    const checkbox = document.createElement("div");
                    checkbox.className = "card-checkbox";
                    checkbox.innerHTML = '<i class="fa-solid fa-check"></i>';

                    cardTop.appendChild(badge);
                    cardTop.appendChild(checkbox);
                    card.appendChild(cardTop);

                    // Card Content
                    const cardContent = document.createElement("div");
                    cardContent.className = "card-content";
                    cardContent.innerHTML = update.html;
                    card.appendChild(cardContent);

                    // Card Actions
                    const cardActions = document.createElement("div");
                    cardActions.className = "card-actions";

                    // Tweet button
                    const tweetBtn = document.createElement("button");
                    tweetBtn.className = "card-action-btn tweet-btn";
                    tweetBtn.innerHTML = '<i class="fa-brands fa-x-twitter"></i> Tweet';
                    tweetBtn.addEventListener("click", (e) => {
                        e.stopPropagation(); // Prevent card selection
                        openTweetComposer(entry, update);
                    });

                    // Copy button
                    const copyBtn = document.createElement("button");
                    copyBtn.className = "card-action-btn";
                    copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
                    copyBtn.addEventListener("click", (e) => {
                        e.stopPropagation(); // Prevent card selection
                        navigator.clipboard.writeText(update.text);
                        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy';
                        }, 2000);
                    });

                    cardActions.appendChild(copyBtn);
                    cardActions.appendChild(tweetBtn);
                    card.appendChild(cardActions);

                    // Selection trigger
                    card.addEventListener("click", () => {
                        toggleCardSelection(update.id);
                    });

                    grid.appendChild(card);
                });

                dateGroup.appendChild(grid);
                notesFeed.appendChild(dateGroup);
            }
        });

        if (visibleEntriesCount === 0) {
            notesFeed.style.display = "none";
            emptyState.style.display = "flex";
        } else {
            emptyState.style.display = "none";
            notesFeed.style.display = "flex";
        }
    }

    // Card Selection Logic
    function toggleCardSelection(id) {
        if (selectedUpdateId === id) {
            // Deselect
            selectedUpdateId = null;
        } else {
            // Select (Single selection mode for tweets makes sense to keep it simple and clean)
            selectedUpdateId = id;
        }

        // Re-render UI cards styling
        document.querySelectorAll(".update-card").forEach(card => {
            if (card.dataset.id === selectedUpdateId) {
                card.classList.add("selected");
            } else {
                card.classList.remove("selected");
            }
        });

        updateSelectionBar();
    }

    function clearSelection() {
        selectedUpdateId = null;
        document.querySelectorAll(".update-card").forEach(card => {
            card.classList.remove("selected");
        });
        updateSelectionBar();
    }

    function updateSelectionBar() {
        if (selectedUpdateId) {
            selectionCount.textContent = "1 update selected";
            selectionBar.classList.add("active");
        } else {
            selectionBar.classList.remove("active");
        }
    }

    // Tweet Composer Modal Management
    function openTweetComposer(entry, update) {
        // Set type and date badges
        modalBadge.className = `badge ${update.type.toLowerCase()}`;
        modalBadge.textContent = update.type;
        modalDate.textContent = entry.date;
        
        // Show truncated source text preview
        modalSourceText.textContent = update.text;

        // Generate pre-formatted text for Twitter
        // Formula: "BigQuery [Type] ([Date]): [Text] [URL] #BigQuery #GoogleCloud"
        const hashtag = " #BigQuery #GoogleCloud";
        const prefix = `BigQuery ${update.type} (${entry.date}): `;
        const url = entry.link || "";

        // Twitter reserves 23 characters for URLs
        const urlReservedLength = 23;
        const spacesAndQuotesLength = 4; // Space + 2 quotes + space before url
        const maxTextLength = 280 - (prefix.length + urlReservedLength + hashtag.length + spacesAndQuotesLength);

        let bodyText = update.text;
        if (bodyText.length > maxTextLength) {
            bodyText = bodyText.substring(0, maxTextLength - 3) + "...";
        }

        tweetTextarea.value = `${prefix}"${bodyText}" ${url}${hashtag}`;
        
        // Open Modal
        tweetModal.classList.add("active");
        updateCharCount();
        tweetTextarea.focus();
    }

    function closeTweetComposer() {
        tweetModal.classList.remove("active");
    }

    function updateCharCount() {
        const text = tweetTextarea.value;
        const length = text.length;

        // Twitter counts any URL as 23 characters, so we need to calculate that accurately
        // We'll replace URLs in the text with a 23-char placeholder for counting
        const urlRegex = /https?:\/\/[^\s]+/g;
        let charCount = length;
        const urls = text.match(urlRegex);
        if (urls) {
            urls.forEach(url => {
                charCount = charCount - url.length + 23;
            });
        }

        charCounter.textContent = `${charCount} / 280`;

        // Styling indicators based on limit
        if (charCount > 280) {
            charCounter.className = "char-counter exceeded";
            btnPublishTweet.disabled = true;
            limitWarning.style.display = "none";
        } else if (charCount >= 250) {
            charCounter.className = "char-counter warning";
            btnPublishTweet.disabled = false;
            limitWarning.style.display = "block";
            limitWarning.textContent = "Approaching character limit!";
        } else {
            charCounter.className = "char-counter";
            btnPublishTweet.disabled = false;
            limitWarning.style.display = "none";
        }
    }

    function exportFilteredNotesToCSV() {
        if (!releaseNotes || releaseNotes.length === 0) return;

        const csvRows = [];
        csvRows.push(['Date', 'Type', 'URL', 'Content'].map(escapeCSV).join(','));

        releaseNotes.forEach(entry => {
            const filteredUpdates = entry.updates.filter(update => {
                const matchesType = currentFilterType === "all" || update.type.toLowerCase() === currentFilterType;
                const matchesSearch = searchQuery === "" || 
                    update.type.toLowerCase().includes(searchQuery) ||
                    update.text.toLowerCase().includes(searchQuery) ||
                    entry.date.toLowerCase().includes(searchQuery);

                return matchesType && matchesSearch;
            });

            filteredUpdates.forEach(update => {
                const row = [
                    entry.date,
                    update.type,
                    entry.link || '',
                    update.text
                ];
                csvRows.push(row.map(escapeCSV).join(','));
            });
        });

        if (csvRows.length <= 1) {
            alert("No data to export with the current filters.");
            return;
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const typeStr = currentFilterType !== 'all' ? `_${currentFilterType}` : '';
        link.setAttribute("href", url);
        link.setAttribute("download", `bigquery_release_notes_${dateStr}${typeStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function escapeCSV(field) {
        if (field === null || field === undefined) return '""';
        const stringVal = String(field);
        const escaped = stringVal.replace(/"/g, '""');
        return `"${escaped}"`;
    }
});
