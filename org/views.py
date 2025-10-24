import os
import pyttsx3
import fitz
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import FileSystemStorage
import threading


import pyttsx3

tts_engine = pyttsx3.init()

# def read_pdf(request):
#     # extract text, etc.
#     tts_engine.say("some text")
#     tts_engine.runAndWait()
#     return JsonResponse({'success': True})

# def stop_reading(request):
#     if request.method == 'POST':
#         tts_engine.stop()
#         return JsonResponse({'success': True, 'message': 'Reading stopped.'})



def index(request):
    return render(request, 'org/reader.html')

@csrf_exempt
def read_pdf(request):
    if request.method == 'POST' and request.FILES.get('pdf_file'):
        try:
            # Get the uploaded file
            pdf_file = request.FILES['pdf_file']
            start_page = request.POST.get('start_page', '').strip()
            end_page = request.POST.get('end_page', '').strip()
            
            # Save the uploaded file temporarily
            fs = FileSystemStorage()
            filename = fs.save(pdf_file.name, pdf_file)
            file_path = fs.path(filename)
            
            # Extract text from PDF
            doc = fitz.open(file_path)
            text = ""
            
            if not start_page and not end_page:
                # Read all pages
                for page in doc:
                    text += page.get_text()
            elif not start_page:
                # Read from beginning to end_page
                end = int(end_page)
                for i in range(min(end, len(doc))):
                    page = doc.load_page(i)
                    text += page.get_text()
            elif not end_page:
                # Read from start_page to end
                start = int(start_page) - 1
                for i in range(max(start, 0), len(doc)):
                    page = doc.load_page(i)
                    text += page.get_text()
            else:
                # Read specific range
                start = int(start_page) - 1
                end = int(end_page)
                for i in range(max(start, 0), min(end, len(doc))):
                    page = doc.load_page(i)
                    text += page.get_text()
            
            doc.close()
            
            # Clean up the temporary file
            fs.delete(filename)
            
            # Start text-to-speech in a separate thread
            def speak_text(text_content):
                try:
                    engine = pyttsx3.init()
                    engine.say(text_content)
                    engine.runAndWait()
                except Exception as e:
                    print(f"TTS Error: {e}")
            
            # Start TTS in background thread
            tts_thread = threading.Thread(target=speak_text, args=(text,))
            tts_thread.daemon = True
            tts_thread.start()
            
            return JsonResponse({
                'success': True,
                'message': 'Reading started successfully!',
                'text_length': len(text)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            })
    
    return JsonResponse({
        'success': False,
        'error': 'No file uploaded'
    })


@csrf_exempt
def stop_reading(request):
    if request.method == 'POST':
        tts_engine.stop()
        return JsonResponse({'success': True, 'message': 'Reading stopped.'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)
