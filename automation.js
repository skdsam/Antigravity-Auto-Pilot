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

    // shadow DOM traversal helper
    function getAllElements(root = document) {
        let elements = Array.from(root.querySelectorAll('*'));
        const shadowElements = [];

        elements.forEach(el => {
            if (el.shadowRoot) {
                shadowElements.push(...getAllElements(el.shadowRoot));
            }
        });

        return elements.concat(shadowElements);
    }

    function isAcceptButton(el, verbose = false) {
        // Skip if hidden or disabled
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        const isInteractable = !el.disabled && el.getAttribute('aria-disabled') !== 'true';

        if (!isVisible || !isInteractable) {
            if (verbose && (el.textContent || el.getAttribute('aria-label'))) {
                // log(`Skipping non-interactable: "${el.textContent}" [visible: ${isVisible}, interactable: ${isInteractable}]`);
            }
            return false;
        }

        const text = (el.textContent || el.getAttribute('aria-label') || el.value || el.title || '').trim().toLowerCase();
        if (!text) return false;

        // Check if button matches any of our patterns
        const matchesPattern = patterns.some(p => text === p || text.includes(p));
        if (!matchesPattern) return false;

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
        '[aria-label*="apply"]',
        '[aria-label*="all"]'
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

    // Diagnostic logging
    if (buttons.length > 0) {
        // log(`Found ${buttons.length} potential buttons.`);
    }

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

    return "No actionable buttons found";
})();