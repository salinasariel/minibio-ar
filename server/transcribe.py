#!/usr/bin/env python3
import sys
import json
import subprocess
import os
import tempfile
from vosk import Model, KaldiRecognizer
import wave

def transcribe_audio(audio_path, model_path="/opt/vosk-models/vosk-model-small-es-0.42"):
    # Convertir a WAV 16kHz mono si no es WAV
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_wav:
        wav_path = tmp_wav.name

    try:
        subprocess.run([
            'ffmpeg', '-i', audio_path,
            '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le',
            '-y', wav_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Cargar modelo
        model = Model(model_path)
        wf = wave.open(wav_path, 'rb')
        framerate = wf.getframerate()
        rec = KaldiRecognizer(model, framerate)
        rec.SetWords(True)

        result = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result.append(json.loads(rec.Result()))

        result.append(json.loads(rec.FinalResult()))
        wf.close()

        text = " ".join([r.get("text", "") for r in result if "text" in r])
        return text.strip()
    finally:
        if 'wf' in locals():
            wf.close()
        os.unlink(wav_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: ./transcribe.py <audio.ogg|wav|mp3>")
        sys.exit(1)
    audio_file = sys.argv[1]
    try:
        texto = transcribe_audio(audio_file)
        print(texto)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)