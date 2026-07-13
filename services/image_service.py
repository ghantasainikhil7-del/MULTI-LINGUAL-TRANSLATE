import pytesseract
from PIL import Image
import platform

# Only set explicit path on Windows. On Linux (Docker), pytesseract will find the system binary automatically.
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_from_image(path):

    img = Image.open(path)

    text = pytesseract.image_to_string(img)

    return text