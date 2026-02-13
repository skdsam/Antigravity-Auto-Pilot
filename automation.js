(function () {
    const log = (msg) => console.log(`[Auto-Pilot] ${msg}`);

    // Patterns for buttons to click
    const patterns = [
        'accept', 'accept all', 'apply', 'apply all',
        'approve', 'proceed', 'continue', 'run',
        'execute', 'confirm', 'yes', 'ok', 'retry'
    ];

    // Dangerous command blocklist - prioritize safety
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

    function isAcceptButton(el) {
        // Skip if hidden or disabled
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || el.disabled) return false;

        const text = (el.textContent || el.getAttribute('aria-label') || '').trim().toLowerCase();
        if (!text) return false;

        // Check if button matches any of our patterns
        if (!patterns.some(p => text.includes(p))) return false;

        // Contextual safety check for terminal commands
        // We look for nearby text that might contain a dangerous command
        const container = el.closest('div, section, article, .bg-ide-card-background');
        if (container) {
            const containerText = container.textContent.toLowerCase();
            if (isDangerous(containerText)) {
                log(`SAFETY BLOCK: Dangerous pattern detected in context: "${containerText.substring(0, 50)}..."`);
                return false;
            }
        }

        return true;
    }

    // Look for standard buttons and typical Antigravity custom button classes
    const selectors = 'button, .bg-ide-button-background, [role="button"], .v-btn';
    const buttons = Array.from(document.querySelectorAll(selectors));

    // Strategy: Prefer "Accept All" or "Apply All" if present, otherwise take the first match
    const priorityPatterns = ['accept all', 'apply all', 'approve all'];
    let target = buttons.find(el => {
        const text = el.textContent.toLowerCase();
        return priorityPatterns.some(pp => text.includes(pp)) && isAcceptButton(el);
    });

    if (!target) {
        target = buttons.find(isAcceptButton);
    }

    if (target) {
        log(`Auto-Pilot clicking: "${target.textContent.trim()}"`);
        target.click();
        return `Clicked: ${target.textContent.trim()}`;
    }

    return "No actionable buttons found";
})();