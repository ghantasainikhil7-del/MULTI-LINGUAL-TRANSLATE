import fitz
import docx

def extract_text_from_file(path):

    if path.endswith(".pdf"):

        doc = fitz.open(path)

        text = ""

        for page in doc:

            text += page.get_text()

        return text


    elif path.endswith(".docx"):

        doc = docx.Document(path)

        text = "\n".join([p.text for p in doc.paragraphs])

        return text


    elif path.endswith(".txt"):

        with open(path, "r", encoding="utf-8") as f:

            return f.read()