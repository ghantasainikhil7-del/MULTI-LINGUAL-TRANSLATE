import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';

// Supported translation languages
const LANGUAGES = {
    "German": "deu_Latn",
    "French": "fra_Latn",
    "Spanish": "spa_Latn",
    "Hindi": "hin_Deva",
    "Telugu": "tel_Telu",
    "Dutch": "nld_Latn",
    "Arabic": "arb_Arab",
    "Portuguese": "por_Latn",
    "Spanish (Argentina)": "spa_Latn"
};

let translatorInstance = null;
const fileProgress = {};

// Helper: Clean up whitespace
function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
}

// Helper: Chunk text into smaller word limits
function splitText(text, maxChunkSize = 400) {
    const words = text.split(' ');
    const chunks = [];
    for (let i = 0; i < words.length; i += maxChunkSize) {
        chunks.push(words.slice(i, i + maxChunkSize).join(' '));
    }
    return chunks;
}

// Update UI character count
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('char-count');

function updateCharCount() {
    const text = inputText.value;
    charCount.innerText = `${text.length} / 2000`;
}
inputText.addEventListener('input', updateCharCount);

// Model loading progress update
function updateLoaderProgress(data) {
    if (data.status === 'downloading' || data.status === 'progress') {
        fileProgress[data.file] = data.progress || 0;
        
        renderFileProgressList();
        
        const files = Object.keys(fileProgress);
        const sum = files.reduce((acc, f) => acc + fileProgress[f], 0);
        const avg = files.length > 0 ? (sum / files.length) : 0;
        
        document.getElementById('progress-bar').style.width = `${avg}%`;
        document.getElementById('progress-percentage').innerText = `${avg.toFixed(2)}%`;
    } else if (data.status === 'done') {
        fileProgress[data.file] = 100;
        renderFileProgressList();
    } else if (data.status === 'ready') {
        document.getElementById('progress-bar').style.width = '100%';
        document.getElementById('progress-percentage').innerText = '100.00%';
        setTimeout(() => {
            const loader = document.getElementById('model-loader');
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }, 500);
    }
}

function renderFileProgressList() {
    const listEl = document.getElementById('file-progress-list');
    listEl.innerHTML = '';
    for (const [file, progress] of Object.entries(fileProgress)) {
        const item = document.createElement('div');
        item.className = 'file-progress-item';
        
        const filename = file.split('/').pop();
        item.innerHTML = `
            <div class="file-info">
                <span class="file-name-label">${filename}</span>
                <span>${progress.toFixed(1)}%</span>
            </div>
            <div class="sub-progress-bar-container">
                <div class="sub-progress-bar" style="width: ${progress}%"></div>
            </div>
        `;
        listEl.appendChild(item);
    }
}

// Drag & Drop / File Upload handlers
const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const fileStatus = document.getElementById('file-status');
const fileNameSpan = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file-btn');

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

removeFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileStatus.style.display = 'none';
    inputText.value = '';
    updateCharCount();
});

async function handleFile(file) {
    fileStatus.style.display = 'flex';
    fileNameSpan.innerText = file.name;
    
    inputText.value = "Reading and parsing file. Please wait...";
    
    try {
        if (file.type.startsWith('image/')) {
            inputText.value = "Starting OCR. Processing image...";
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing') {
                        inputText.value = `Running OCR: ${Math.round(m.progress * 100)}%`;
                    }
                }
            });
            inputText.value = result.data.text;
            updateCharCount();
        } else if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                inputText.value = e.target.result;
                updateCharCount();
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.docx')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                inputText.value = result.value;
                updateCharCount();
            };
            reader.readAsArrayBuffer(file);
        } else if (file.name.endsWith('.pdf')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    inputText.value = `Extracting PDF page ${i} of ${pdf.numPages}...`;
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map(item => item.str);
                    text += strings.join(' ') + '\n';
                }
                inputText.value = text;
                updateCharCount();
            };
            reader.readAsArrayBuffer(file);
        } else {
            inputText.value = "";
            alert("Unsupported file format. Please upload PDF, DOCX, TXT, or image files.");
            fileStatus.style.display = 'none';
        }
    } catch (err) {
        console.error("File processing error:", err);
        inputText.value = "Error reading file contents.";
    }
}

// Copy Translation
document.getElementById('copy-btn').addEventListener('click', () => {
    const text = document.getElementById('translatedText').innerText;
    if (text && text !== "Translation will appear here...") {
        navigator.clipboard.writeText(text);
        const copyBtn = document.getElementById('copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Copied!
        `;
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }
});

// Translation action
async function translate() {
    const text = inputText.value;
    const targetLang = document.getElementById('languageSelect').value;
    
    if (!text.trim() || text === "Reading and parsing file. Please wait..." || text === "Error reading file contents.") {
        alert("Please enter some text or upload a file first.");
        return;
    }
    
    const translateBtn = document.getElementById('translateBtn');
    const outputBox = document.getElementById('translatedText');
    
    translateBtn.disabled = true;
    translateBtn.classList.add('loading');
    translateBtn.innerText = "Translating...";
    
    outputBox.classList.add('placeholder');
    outputBox.innerText = "Translating text...";
    
    try {
        const cleaned = cleanText(text);
        const chunks = splitText(cleaned);
        const translatedChunks = [];
        
        for (let i = 0; i < chunks.length; i++) {
            const result = await translatorInstance(chunks[i], {
                src_lang: 'eng_Latn',
                tgt_lang: targetLang
            });
            translatedChunks.push(result[0].translation_text);
        }
        
        outputBox.classList.remove('placeholder');
        outputBox.innerText = translatedChunks.join(' ');
        document.getElementById('copy-btn').disabled = false;
    } catch (err) {
        console.error("Translation error:", err);
        outputBox.innerText = "Error during translation. Please try again.";
    } finally {
        translateBtn.disabled = false;
        translateBtn.classList.remove('loading');
        translateBtn.innerText = "Translate";
    }
}
document.getElementById('translateBtn').addEventListener('click', translate);

// Initialize Page
async function init() {
    try {
        // Set worker for PDFJS
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        // Populate languages dropdown
        const langSelect = document.getElementById('languageSelect');
        for (const [name, code] of Object.entries(LANGUAGES)) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            langSelect.appendChild(option);
        }
        
        // Load model
        translatorInstance = await pipeline('translation', 'Xenova/nllb-200-distilled-600m', {
            progress_callback: updateLoaderProgress
        });
        
        // Fallback: trigger ready if progress callback didn't fire it
        updateLoaderProgress({ status: 'ready' });
    } catch (err) {
        console.error("Initialization failed:", err);
        alert("Failed to load translation model. Please refresh and try again.");
    }
}

// Start
init();
