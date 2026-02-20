#!/usr/bin/env python3
import time
import os
import subprocess
import sys
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

INBOUND_DIR = "/root/.openclaw/media/inbound"
TRANSCRIBE_SCRIPT = "/root/.openclaw/workspace/minibio-ar/server/transcribe.py"
PYTHON_VENV = "/opt/vosk-env/bin/python"
MODEL_PATH = "/opt/vosk-models/vosk-model-small-es-0.42"

class AudioHandler(FileSystemEventHandler):
    def __init__(self):
        self.processed = set()

    def on_created(self, event):
        if event.is_directory:
            return
        path = event.src_path
        if not path.lower().endswith(('.ogg', '.wav', '.mp3', '.m4a', '.opus')):
            return
        # Esperar a que el archivo se escriba completamente
        time.sleep(1)
        self.transcribe_and_notify(path)

    def transcribe_and_notify(self, audio_path):
        if audio_path in self.processed:
            return
        try:
            print(f"[Watcher] Transcribiendo: {audio_path}")
            result = subprocess.run(
                [PYTHON_VENV, TRANSCRIBE_SCRIPT, audio_path],
                capture_output=True, text=True, timeout=60
            )
            texto = result.stdout.strip()
            if texto:
                # Enviar transcripción a WhatsApp de Ariel
                subprocess.run([
                    "openclaw", "message", "send",
                    "--to", "+5493412295453",
                    "--channel", "whatsapp",
                    "--message", f"📝 Transcripción de audio:\n\n{texto}"
                ])
                print(f"[Watcher] Enviada transcripción: {texto[:50]}...")
            else:
                print(f"[Watcher] No se obtuvo texto de {audio_path}")
        except Exception as e:
            print(f"[Watcher] Error: {e}")
        finally:
            self.processed.add(audio_path)

if __name__ == "__main__":
    if not os.path.exists(INBOUND_DIR):
        print(f"Directorio no existe: {INBOUND_DIR}")
        sys.exit(1)
    event_handler = AudioHandler()
    observer = Observer()
    observer.schedule(event_handler, INBOUND_DIR, recursive=False)
    observer.start()
    print(f"[Watcher] Monitoreando {INBOUND_DIR} para audios...")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()