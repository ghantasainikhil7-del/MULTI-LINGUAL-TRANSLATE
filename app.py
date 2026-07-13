from flask import Flask, render_template, request
import os

from services.text_service import process_text
from services.file_service import extract_text_from_file
from services.image_service import extract_text_from_image
from utils.language_codes import LANGUAGES

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET","POST"])
def home():

    translation = ""

    if request.method == "POST":

        language = request.form["language"]

        text = request.form.get("text")

        if text:

            translation = process_text(text, language)

        file = request.files.get("file")

        if file and file.filename != "":

            path = os.path.join(UPLOAD_FOLDER, file.filename)

            file.save(path)

            extracted = extract_text_from_file(path)

            translation = process_text(extracted[:2000], language)

        image = request.files.get("image")

        if image and image.filename != "":

            path = os.path.join(UPLOAD_FOLDER, image.filename)

            image.save(path)

            extracted = extract_text_from_image(path)

            translation = process_text(extracted, language)

    return render_template(
        "index.html",
        languages=LANGUAGES,
        translation=translation
        
    )

if __name__ == "__main__":
    app.run(debug=True)