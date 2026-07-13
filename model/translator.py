from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

model_name = "facebook/nllb-200-distilled-600M"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

def translate_text(text, target_lang):

    tokenizer.src_lang = "eng_Latn"

    inputs = tokenizer(text, return_tensors="pt", truncation=True)

    translated_tokens = model.generate(
    **inputs,
    forced_bos_token_id=tokenizer.convert_tokens_to_ids(target_lang),
    max_length=256,
    num_beams=2,
    early_stopping=True
)

    result = tokenizer.batch_decode(translated_tokens, skip_special_tokens=True)

    return result[0]