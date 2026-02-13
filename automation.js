(function () {
    const log = (msg) => console.log(`[Auto-Pilot] ${msg}`);

    // Sanity check: Avoid running in Quokka or other unintended pages
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();
    const isQuokka = title.includes('quokka') ||
        url.includes('quokka') ||
        url.includes('wallabyjs') ||
        document.querySelector('[data-quokka-root]');

    if (isQuokka) {
        return "Skipping Quokka/Wallaby-related page";
    }

    // Patterns for matching buttons
    const patterns = [
        'accept', 'accept all', 'apply', 'apply all',
        'approve', 'proceed', 'continue', 'run',
        'execute', 'confirm', 'yes', 'ok', 'retry'
    ];

    // Priority patterns - we want to click "All" versions first
    const priorityPatterns = [
        'accept all', 'apply all', 'approve all', 'accept changes',
        'accept all content', 'apply all changes', 'approve all changes'
    ];

    // Dangerous command blocklist
    const dangerousCommands = [
        'rm -rf', 'rmdir', 'del /s', 'mkfs', 'format',
        'chmod -R 777', 'chown', 'sudo', 'shutdown',
        'mv /* /dev/null', 'dd if=', '> /etc/', 'kill -9',
        'shred', 'wipe', 'fdisk'
    ];

    function isDangerous(text) {
        const lowerText = text.toLowerCase();
        return dangerousCommands.some(cmd => lowerText.includes(cmd));
    }

    // shadow DOM and iframe traversal helper
    function getAllElements(root = document) {
        let elements = [];
        try {
            elements = Array.from(root.querySelectorAll('*'));
        } catch (e) {
            // Likely cross-origin iframe or restricted root
            return [];
        }

        const additionalElements = [];

        elements.forEach(el => {
            // Shadow DOM
            if (el.shadowRoot) {
                additionalElements.push(...getAllElements(el.shadowRoot));
            }
            // Iframes
            if (el.tagName === 'IFRAME') {
                try {
                    const iframeDoc = el.contentDocument || el.contentWindow.document;
                    if (iframeDoc) {
                        additionalElements.push(...getAllElements(iframeDoc));
                    }
                } catch (e) {
                    // Cross-origin restriction
                }
            }
        });

        return elements.concat(additionalElements);
    }

    function isAcceptButton(el, verbose = false) {
        // Skip if hidden or disabled
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        const isInteractable = !el.disabled && el.getAttribute('aria-disabled') !== 'true';

        if (!isVisible || !isInteractable) return false;

        // Skip if it's part of VS Code system UI (Activity Bar, Status Bar, etc.)
        let curr = el;
        while (curr && curr !== document.body) {
            if (curr.classList && (
                curr.classList.contains('activitybar') ||
                curr.classList.contains('statusbar') ||
                curr.classList.contains('menubar') ||
                curr.classList.contains('titlebar') ||
                curr.classList.contains('tabs-container') ||
                curr.id === 'workbench.parts.activitybar' ||
                curr.id === 'workbench.parts.statusbar'
            )) {
                return false;
            }
            curr = curr.parentElement || (curr.getRootNode && curr.getRootNode().host);
        }

        const text = (el.textContent || el.getAttribute('aria-label') || el.value || el.title || '').trim().toLowerCase();
        if (!text) return false;

        // Check if button matches any of our patterns
        const matchesPattern = patterns.some(p => {
            // Strict matching for very short words to avoid "Run and Debug" matching "run"
            if (p === 'run' || p === 'ok' || p === 'yes') {
                return text === p;
            }
            return text === p || text.includes(p);
        });

        if (!matchesPattern) return false;
        
        // Final sanity check: avoid obviously navigation-related buttons
        if (text.includes('extensions') || text.includes('search') || text.includes('debug') || text.includes('source control')) {
            return false;
        }

        // Contextual safety check - more targeted
        const container = el.parentElement;
        if (container) {
            const containerText = container.textContent.toLowerCase();
            if (isDangerous(containerText) && !text.includes('all')) {
                log(`SAFETY BLOCK: Dangerous pattern detected in immediate context: "${containerText.substring(0, 50)}..."`);
                return false;
            }
        }

        return true;
    }

    // Broader selectors for buttons
    const selectors = [
        'button',
        '.bg-ide-button-background',
        '[role="button"]',
        '.v-btn',
        'input[type="button"]',
        'input[type="submit"]',
        '.btn',
        '.button',
        'a[class*="button"]',
        'span[class*="button"]',
        'div[class*="button"]',
        '[aria-label*="accept"]',
        '[aria-label*="apply"]'
        // Removed [aria-label*="all"] as it's too broad (matches "Clear All", etc.)
    ];

    const allElements = getAllElements();
    const buttons = allElements.filter(el => {
        if (!el.matches) return false;

        const style = window.getComputedStyle(el);
        const hasPointerCursor = style.cursor === 'pointer';

        return selectors.some(s => el.matches(s)) ||
            (el.tagName === 'DIV' && el.classList.contains('button')) ||
            (el.getAttribute('role') === 'button') ||
            hasPointerCursor;
    });

    // Strategy 1: Look for Priority "All" buttons
    let target = buttons.find(el => {
        const text = (el.textContent || el.getAttribute('aria-label') || '').toLowerCase();
        const isPriority = priorityPatterns.some(pp => text.includes(pp));
        return isPriority && isAcceptButton(el);
    });

    // Strategy 2: Look for any Accept button
    if (!target) {
        target = buttons.find(el => isAcceptButton(el));
    }

    if (target) {
        const label = (target.textContent || target.getAttribute('aria-label') || 'unnamed button').trim();
        log(`Auto-Pilot clicking: "${label}"`);
        target.click();
        return `Clicked: ${label}`;
    }

    return null;
})();