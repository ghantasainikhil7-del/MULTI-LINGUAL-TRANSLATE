from config import MAX_CHUNK_SIZE

def split_text(text):

    words = text.split()

    chunks = []

    for i in range(0, len(words), MAX_CHUNK_SIZE):

        chunk = " ".join(words[i:i + MAX_CHUNK_SIZE])

        chunks.append(chunk)

    return chunks