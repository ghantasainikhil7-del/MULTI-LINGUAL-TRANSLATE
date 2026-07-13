from model.translator import translate_text
from utils.text_cleaner import clean_text
from utils.text_chunker import split_text

def process_text(text, target_lang):
    text = text[:500]
    text = clean_text(text)

    chunks = split_text(text)

    translated_chunks = []

    for chunk in chunks:

        translated = translate_text(chunk, target_lang)

        translated_chunks.append(translated)

    return " ".join(translated_chunks)