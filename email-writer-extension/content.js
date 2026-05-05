console.log("Email Writer extension - Content Script Loaded...");
function createAIButton(){
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px';
    button.innerHTML = 'AI Reply';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltp', 'Generate Email Reply');
    return button;
}
function getEmailContent() {
    const selectors = ['.h7', '.a3s.aiL', '.gmail_quote']; // Added dot to .a3s
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content && content.innerText.trim()) {
            return content.innerText.trim();
        }
    }
    return ''; 
}
function findComposeToolbar() {
    const selectors = ['.btC', '.aDh', '[role="toolbar"]']; // Added dot to .aDh
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) return toolbar;
    }
    return null;
}

function injectButton(){
    const existingButton = document.querySelector('.ai-reply-button');
    if(existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if(!toolbar){
        console.log("Toolbar not found");
        return;
    }
    console.log("toolbar found, creating ai button.");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

  button.addEventListener('click', async () => {
    try {
        button.innerHTML = 'Generating...';
        button.style.pointerEvents = 'none'; // Better than .disabled for <div>

        const emailContent = getEmailContent();
        // FIX: Assign the result to 'response'
        const response = await fetch('http://localhost:8080/api/email/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailContent, tone: "Professional" })
        });

        if (!response.ok) throw new Error('API request failed');
        
        const generatedReply = await response.text();
        // FIX: Corrected typo 'textbox'
        const ComposeBox = document.querySelector('[role="textbox"][g_editable="true"]');

        if (ComposeBox) {
            ComposeBox.focus();
            document.execCommand('insertText', false, generatedReply);
        }
    } catch (error) {
        console.error(error);
        alert('Failed to generate reply...');
    } finally {
        button.innerHTML = 'AI Reply';
        button.style.pointerEvents = 'auto';
    }
});
    toolbar.insertBefore(button, toolbar.firstChild);
}
const observer = new MutationObserver((mutations) => {
    for(const mutation of mutations){
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('.aDh, .btC, [role="dialog"]')|| node.querySelector('.aDh, .btC, [role="dialog"]'))
        );
        if(hasComposeElements){
            console.log("Compose Window detected.");
            setTimeout(injectButton,500);
        }
    }
});

observer.observe(document.body,{
    childList: true,
    subtree: true
})