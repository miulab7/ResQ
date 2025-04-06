// background.js - Refactored Version

// --------------------------------------------------
// Global State Management (state object)
// --------------------------------------------------
const state = {
    contentTabId: null,
    replyEditorWindowId: null,
    replyEditorTabId: null,
    email_information: {
        html: "",
        text: "",
        title: "",
        sender: "",
        receive_time: "",
        current_time: "",
        past_html: ""
    },
    user_information: {
        full_name: "",
        email: "",
        affiliation: "",
        language: "",
        role: "",
        signature: "",
        other_info: ""
    },
    customization: {
        sender_role: "",
        recipient_role: "",
        formality: "",
        tone: "",
        urgency: "",
        length: "",
        purpose: "",
        additional_request: ""
    },

    selected_choices: [
        {
            question: "",
            choices: []
        }
    ],
    current_reply: "",
    api_key: "********",
    conversationHistory: [],
    isListenerAdded: false
};

// --------------------------------------------------
// Common API Request Function
// --------------------------------------------------
async function requestAPI(url, payload) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            duplex: 'half'
        });
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        console.log('API request successful:', response);
        return response;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

const checkTabExists = tabId => {
    return new Promise(resolve => {
        chrome.tabs.get(tabId, tab => {
        resolve(!!tab);
        });
    });
};

// --------------------------------------------------
// Question Generation Stream Processing
// --------------------------------------------------

async function generateQuestionStream() {
    const url = 'https://d56gzgm4azqvdyopsztep54buq0gzqom.lambda-url.ap-northeast-1.on.aws/api/questions';
    try {
        const response = await fetch (url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'connection': 'keep-alive',
                'Accept': "*/*",
            },
            body: JSON.stringify({
                email_information: state.email_information,
                user_information: state.user_information,
                api_key: "********",
            }),
            duplex: 'half'
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let receivedText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!value) continue;
            receivedText += decoder.decode(value, { stream: true });
        }

        // Split by newline and remove leading "data:" from each line
        const lines = receivedText.split('\n').map(line => {
            line = line.trim();
            return line.startsWith("data:") ? line.slice(5).trim() : line;
        });
        
        // Remove empty lines and join into one JSON string
        const jsonStr = lines.filter(line => line !== "").join("");

        // Finally, parse the JSON string
        try {
            const jsonData = JSON.parse(jsonStr);
            executeWhenTabIsActive(state.replyEditorTabId, "Questions have been generated!", () => {
                chrome.tabs.sendMessage(state.replyEditorTabId, {
                    action: 'ReflectQuestion',
                    question: jsonData,
                    replyEditorTabId: state.replyEditorTabId
                });
            });
        } catch (error) {
            console.error("JSON parse error", error, "Received text:", jsonStr);
            throw error;
        }
        
    } catch (error) {
        chrome.tabs.remove(state.replyEditorTabId);
        chrome.tabs.sendMessage(state.contentTabId, { action: 'serverError' });
        console.error('Error generating question:', error);
    }
}

// --------------------------------------------------
// Reply Generation Stream Processing
// --------------------------------------------------
const generateReplyStream = async () => {
    try {
        const payload = {
            email_information: state.email_information,
            user_information: state.user_information,
            customization: state.customization,
            selected_choices: state.selected_choices,
            current_reply: state.current_reply,
            api_key: "********",
        };

        console.log("Payload:", payload);

        const response = await requestAPI('https://d56gzgm4azqvdyopsztep54buq0gzqom.lambda-url.ap-northeast-1.on.aws/api/reply', payload);
        const reader = response.body.getReader();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                executeWhenTabIsActive(state.replyEditorTabId, "Reply generated!", () => {
                    chrome.tabs.sendMessage(state.replyEditorTabId, {
                        action: 'finish_generate_reply',
                        replyEditorTabId: state.replyEditorTabId
                    });
                });
                break;
            }
            if (!value) continue;
            const message = new TextDecoder().decode(value);

            console.log("Received message:", message);

            const lines = message.split('\n').map(line => {
                if (line.startsWith("data:")) {
                    return line.slice(5).trim();
                }
                return "";
            });

            lines.forEach((line, index) => {
                lines[index] = line.replace(/\\/g, "\n");
            });

            const finalMessage = lines.join("");
            console.log("Received JSON data:", finalMessage);            
            
            chrome.tabs.sendMessage(state.replyEditorTabId, {
                action: 'reflectReply',
                messageContent: finalMessage,
                replyEditorTabId: state.replyEditorTabId
            });
        }
    } catch (error) {
        console.error('Error generating reply:', error);
    }
}

// --------------------------------------------------
// Execute callback when tab is active (placeholder implementation)
// --------------------------------------------------
function executeWhenTabIsActive(tabId, message, callback) {
    callback();
}

// --------------------------------------------------
// Chrome Action (Icon Click) Handler
// --------------------------------------------------
chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['src/content/content.js']
    });
});

// --------------------------------------------------
// Register Chrome Runtime Message Listener
// --------------------------------------------------
function addMessageListener() {
    if (!state.isListenerAdded) {
        chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.action === 'openEditor') {
            state.email_information = { ...request.email_information };

            // chrome.storageからユーザ情報を読み込み、stateに更新
            chrome.storage.local.get(
            ['fullName', 'email', 'affiliation', 'language', 'role', 'signature', 'otherInfo'],
                result => {
                    if (result.fullName) state.user_information.full_name = result.fullName;
                    if (result.email) state.user_information.email = result.email;
                    if (result.affiliation) state.user_information.affiliation = result.affiliation;
                    if (result.language) state.user_information.language = result.language;
                    if (result.role) state.user_information.role = result.role;
                    if (result.signature) state.user_information.signature = result.signature;
                    if (result.otherInfo) state.user_information.other_info = result.otherInfo;

                    if (!result.signature) {
                        state.user_information.signature =
                            "------------------------------------------" +
                            state.user_information.full_name +
                            state.user_information.affiliation +
                            state.user_information.email +
                            "------------------------------------------";
                    }

                    // If user information is incomplete, open the settings page
                    if (!state.user_information.full_name || !state.user_information.affiliation || !state.user_information.email) {
                        chrome.windows.create({
                            type: 'popup',
                            url: 'src/pages/settings/settings.html',
                            width: 800,
                            height: 600
                        }, window => {
                            setTimeout(() => {
                                chrome.tabs.query({ windowId: window.id }, tabs => {
                                    chrome.tabs.sendMessage(tabs[0].id, { action: 'setPersonalInformation', data: state.user_information });
                                });
                            }, 300);
                        });
                    } else {
                        if (state.replyEditorTabId !== null) {
                            chrome.tabs.get(state.replyEditorTabId, tab => {
                                if (chrome.runtime.lastError || !tab) {
                                    state.replyEditorTabId = null;
                                    openReplyEditorWindow(request);
                                } else if (tab.windowId && chrome.windows && chrome.windows.update) {
                                    chrome.windows.update(tab.windowId, { focused: true });
                                    chrome.tabs.update(state.replyEditorTabId, { active: true });
                                    chrome.tabs.sendMessage(state.replyEditorTabId, { 
                                        action: 'showNotification',
                                        message: 'Reply Editor is already open. Please use the existing window.',
                                        replyEditorTabId: state.replyEditorTabId
                                    });
                                } else {
                                    state.replyEditorTabId = null;
                                    openReplyEditorWindow(request);
                                }
                            });
                        } else {
                            openReplyEditorWindow(request);
                        }
                    }
                }
            );
        } else if (request.action === 'updatePersonalInformation') {
            state.user_information = { ...request.data };
        } else if (request.action === 'generate_questions') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
                generateQuestionStream();
            }
        } else if (request.action === 'finalizeReply') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
            checkTabExists(request.contentTabId).then(exists => {
                if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                }
                if (exists) {
                chrome.tabs.sendMessage(request.contentTabId, {
                    action: 'reflectReply',
                    replyContent: request.replyContent,
                    contentTabId: request.contentTabId,
                    originalContent_html: request.originalMessageContent_html,
                    correspondingReplyTabId: request.replyEditorTabId
                }, response => {
                    if (response && response.status === 'false') {
                        chrome.tabs.sendMessage(request.replyEditorTabId, { action: 'noContentTab', replyEditorTabId: request.replyEditorTabId });
                    } else if (response && response.status === 'true') {
                        chrome.tabs.remove(request.replyEditorTabId);
                    }
                });
                } else {
                    chrome.tabs.sendMessage(request.replyEditorTabId, { action: 'noContentTab', replyEditorTabId: request.replyEditorTabId });
                }
            });
            }
            return true;
        } else if (request.action === 'storeContentTabId') {
            state.contentTabId = sender.tab.id;
            sendResponse({ contentTabId: state.contentTabId });
        } else if (request.action === 'generateReply') {
            if (sender.tab && sender.tab.id === state.replyEditorTabId) {
                state.selected_choices = request.selected_choices;
                state.current_reply = request.current_reply
                state.customization = request.customization;
                generateReplyStream();
            }
        }
        return true;
        });
        state.isListenerAdded = true;
    }
}

addMessageListener();

// --------------------------------------------------
// Editor Window Launch Helper
// --------------------------------------------------
function openReplyEditorWindow(request) {
    chrome.windows.create({
        url: 'src/pages/reply-editor/reply-editor.html',
        type: 'popup',
        state: 'fullscreen'
    }, window => {
        chrome.tabs.query({ windowId: window.id }, tabs => {
            if (tabs && tabs.length > 0) {
                state.replyEditorTabId = tabs[0].id;
                setTimeout(() => {
                    chrome.tabs.sendMessage(state.replyEditorTabId, { 
                        action: 'ReflectMessage',
                        email_information: state.email_information,
                        replyEditorTabId: state.replyEditorTabId, 
                        contentTabId: state.contentTabId, 
                        personalInformation: state.user_information
                    });
                }, 300);
            }
        });
    });
}

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (tabId === state.replyEditorTabId) {
        state.replyEditorTabId = null;
    }
});