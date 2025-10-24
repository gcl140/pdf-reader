import os
import fitz
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
from gtts import gTTS
import tempfile

def index(request):
    return render(request, 'org/reader.html')

@csrf_exempt
def read_pdf(request):
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        try:
            pdf_file = request.FILES['pdf_file']
            start_page = request.POST.get('start_page', '').strip()
            end_page = request.POST.get('end_page', '').strip()
            language = request.POST.get('language', 'en')

            fs = FileSystemStorage()
            filename = fs.save(pdf_file.name, pdf_file)
            file_path = fs.path(filename)

            doc = fitz.open(file_path)
            text = ""
            total_pages = len(doc)
            start = int(start_page) - 1 if start_page else 0
            end = int(end_page) if end_page else total_pages

            for i in range(max(start, 0), min(end, total_pages)):
                text += doc.load_page(i).get_text()

            doc.close()
            fs.delete(filename)

            text = clean_text_for_tts(text)
            if not text.strip():
                return JsonResponse({'success': False, 'error': 'No readable text found'})

            # Generate audio and store it temporarily
            tts = gTTS(text=text, lang=language)
            tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
            tts.save(tmp_file.name)
            audio_filename = os.path.basename(tmp_file.name)
            audio_url = f"/media/{audio_filename}"

            # Move file to media folder
            media_path = os.path.join('media', audio_filename)
            os.rename(tmp_file.name, media_path)

            return JsonResponse({'success': True, 'audio_url': audio_url})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'No file uploaded'})

def clean_text_for_tts(text, max_chars=5000):
    text = ' '.join(text.split())
    return text[:max_chars] + "... [text truncated]" if len(text) > max_chars else text


def stop_reading(request):
    if request.method == 'POST':
        # Implement logic to stop reading the PDF
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)