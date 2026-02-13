(function () {
    const log = (msg) => console.log(`[Auto-Pilot] ${msg}`);
    const patterns = ['accept', 'proceed', 'continue', 'run', 'retry', 'apply', 'execute', 'confirm'];
    const banned = ['rm -rf', 'del /f', 'mkfs', 'chmod -R 777 /']; // Default safety

    function isAcceptButton(el) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (!patterns.some(p => text.includes(p))) return false;

        // Safety check for terminal commands
        if (text.includes('run') || text.includes('execute')) {
            const nearbyText = el.closest('div')?.parentElement?.textContent?.toLowerCase() || '';
            if (banned.some(b => nearbyText.includes(b))) {
                log(`BANNED: Skipping dangerous command: ${nearbyText.substring(0, 30)}...`);
                return false;
            }
        }

        const style = window.getComputedStyle(el);
        return style.display !== 'none' && !el.disabled;
    }

    const buttons = Array.from(document.querySelectorAll('button, .bg-ide-button-background'));
    const target = buttons.find(isAcceptButton);

    if (target) {
        log(`Clicking: ${target.textContent.trim()}`);
        target.click();
        return "Clicked button";
    }
    return "No button found";
})();