import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceAssistantProps {
  onTranscript?: (text: string) => void;
  textToSpeak?: string;
  className?: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  onTranscript,
  textToSpeak,
  className = '',
}) => {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map app language to BCP 47 language code
  const getLangCode = () => {
    switch (language) {
      case 'te':
        return 'te-IN';
      case 'hi':
        return 'hi-IN';
      default:
        return 'en-IN';
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // If either SpeechRecognition or speechSynthesis is missing, feature is unsupported
    if (!SpeechRecognition || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
    }
  }, []);

  // Handle Speech Recognition (Microphone)
  const toggleListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(t.micUnsupported);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = getLangCode();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onTranscript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMessage(t.micDenied);
        } else {
          setErrorMessage(`వాయిస్ లోపం: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setErrorMessage(err.message || 'Microphone error');
    }
  };

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fallback to SpeechSynthesis
  const speakWithSpeechSynthesis = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) {
      setErrorMessage('Audio synthesis is not supported on this device.');
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    utterance.rate = 0.9;

    const voices = window.speechSynthesis.getVoices();
    const prefix = langCode.split('-')[0].toLowerCase();
    const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Handle Text-To-Speech (Speaker) with authentic regional voice playback
  const toggleSpeaking = async () => {
    // If already speaking, stop
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!textToSpeak) return;

    setErrorMessage(null);
    setIsSpeaking(true);

    const langCode = getLangCode();
    const tl = langCode.split('-')[0]; // 'te', 'hi', or 'en'

    // Play native TTS audio (guarantees authentic Telugu / Hindi voices on all systems)
    try {
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${tl}&q=${encodeURIComponent(textToSpeak.slice(0, 200))}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        // Fallback to SpeechSynthesis if audio stream fails
        speakWithSpeechSynthesis(textToSpeak, langCode);
      };

      await audio.play();
    } catch (err) {
      console.warn("Direct audio failed, falling back to speech synthesis:", err);
      speakWithSpeechSynthesis(textToSpeak, langCode);
    }
  };

  if (!speechSupported) {
    return (
      <div className="text-sm text-gray-500 bg-amber-50 p-2 rounded-lg border border-amber-200">
        ℹ️ Voice assistance is not supported in this browser. Please use standard inputs.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        {/* Large Microphone Button */}
        {onTranscript && (
          <button
            type="button"
            onClick={toggleListening}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-lg shadow-md transition-all farmer-touch-target ${
              isListening
                ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-300'
                : 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-95'
            }`}
            aria-label={isListening ? t.listening : t.listenPrompt}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            <span>{isListening ? t.listening : t.voiceAssistant}</span>
          </button>
        )}

        {/* Large Audio Speaker Button */}
        {textToSpeak && (
          <button
            type="button"
            onClick={toggleSpeaking}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-lg shadow-md transition-all farmer-touch-target ${
              isSpeaking
                ? 'bg-amber-600 text-white animate-pulse ring-4 ring-amber-300'
                : 'bg-emerald-800 text-white hover:bg-emerald-900 active:scale-95'
            }`}
            aria-label={isSpeaking ? t.stopSpeak : t.speak}
          >
            {isSpeaking ? <VolumeX className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
            <span>{isSpeaking ? t.stopSpeak : t.speak}</span>
          </button>
        )}
      </div>

      {/* Visual Status Indicator & Text Alternatives */}
      {isListening && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 text-base font-semibold">
          <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
          {t.listening}
        </div>
      )}

      {isSpeaking && (
        <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-base font-semibold">
          <span className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce" />
          🔊 Audio playing in {language === 'te' ? 'Telugu' : language === 'hi' ? 'Hindi' : 'English'}...
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
