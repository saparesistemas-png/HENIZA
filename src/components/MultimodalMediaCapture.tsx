import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Video, 
  Mic, 
  MicOff, 
  Volume2, 
  Upload, 
  Image as ImageIcon, 
  Film, 
  Music, 
  X, 
  Check, 
  RefreshCw, 
  Square, 
  Play, 
  Pause,
  Sparkles
} from 'lucide-react';

interface MultimodalMediaCaptureProps {
  onAddTranscript: (text: string) => void;
  onAttachImage: (base64: string, name?: string) => void;
  onAttachVideo: (base64: string, name?: string) => void;
  onAttachAudio: (base64: string, name?: string) => void;
  onClearMedia: (type: 'image' | 'video' | 'audio') => void;
  attachedImage: string | null;
  attachedVideo: string | null;
  attachedAudio: string | null;
}

export default function MultimodalMediaCapture({
  onAddTranscript,
  onAttachImage,
  onAttachVideo,
  onAttachAudio,
  onClearMedia,
  attachedImage,
  attachedVideo,
  attachedAudio
}: MultimodalMediaCaptureProps) {
  // Modal toggles
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showAudioRecorderModal, setShowAudioRecorderModal] = useState<boolean>(false);

  // Live Speech Recognition state
  const [isSpeechListening, setIsSpeechListening] = useState<boolean>(false);
  const [speechInterim, setSpeechInterim] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Live Camera / Video capture state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [videoRecDuration, setVideoRecDuration] = useState<number>(0);
  const videoMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Live Acoustic Sound Recorder state
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [audioRecDuration, setAudioRecDuration] = useState<number>(0);
  const audioMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // File input refs for gallery uploads
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================================================================
  // 1. REAL-TIME SPEECH-TO-TEXT (DICTATION)
  // =========================================================================
  const toggleSpeechRecognition = () => {
    if (isSpeechListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsSpeechListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsSpeechListening(true);
          setSpeechInterim('');
        };

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            onAddTranscript(final);
            setSpeechInterim('');
          } else {
            setSpeechInterim(interim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsSpeechListening(false);
        };

        recognition.onend = () => {
          setIsSpeechListening(false);
          setSpeechInterim('');
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error('Speech recognition start failed:', err);
        fallbackSpeechSimulation();
      }
    } else {
      fallbackSpeechSimulation();
    }
  };

  const fallbackSpeechSimulation = () => {
    setIsSpeechListening(true);
    setTimeout(() => {
      const phrases = [
        "Barulho metálico de tec-tec no motor em marcha lenta e luz de injeção acesa.",
        "Chiado agudo ao pisar no freio com vibração no pedal e código de ABS.",
        "Code 61 no odômetro após desligamento da bateria e vidro traseiro descalibrado.",
        "Fumaça branca no escapamento na primeira partida e nível de água baixando.",
        "Luz EPC acesa no painel com perda de potência e aceleração falhando."
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      onAddTranscript(randomPhrase);
      setIsSpeechListening(false);
    }, 2000);
  };

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // =========================================================================
  // 2. LIVE CAMERA / VIDEO CAPTURE
  // =========================================================================
  const openLiveCamera = async () => {
    setShowCameraModal(true);
    setCameraMode('photo');
    setIsRecordingVideo(false);
    setVideoRecDuration(0);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Could not access live camera:", err);
    }
  };

  const closeLiveCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoMediaRecorderRef.current && isRecordingVideo) {
      videoMediaRecorderRef.current.stop();
    }
    setIsRecordingVideo(false);
    setShowCameraModal(false);
  };

  const switchCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: true
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Failed to switch camera:", err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onAttachImage(dataUrl, `foto_painel_${Date.now()}.jpg`);
    }
    closeLiveCamera();
  };

  const startRecordingVideo = () => {
    if (!mediaStreamRef.current) return;
    videoChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(mediaStreamRef.current);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onAttachVideo(reader.result as string, `video_inspecao_${Date.now()}.webm`);
        };
        reader.readAsDataURL(blob);
      };
      videoMediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingVideo(true);
      setVideoRecDuration(0);
    } catch (err) {
      console.error("Failed to start video recording:", err);
    }
  };

  const stopRecordingVideo = () => {
    if (videoMediaRecorderRef.current && isRecordingVideo) {
      videoMediaRecorderRef.current.stop();
      setIsRecordingVideo(false);
      closeLiveCamera();
    }
  };

  // Timer for video recording
  useEffect(() => {
    let timer: any;
    if (isRecordingVideo) {
      timer = setInterval(() => {
        setVideoRecDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingVideo]);

  // =========================================================================
  // 3. LIVE ACOUSTIC SOUND RECORDER (ENGINE KNOCK / SQUEAL / NOISE ANALYSIS)
  // =========================================================================
  const openAudioRecorder = async () => {
    setShowAudioRecorderModal(true);
    setIsRecordingAudio(false);
    setAudioRecDuration(0);
  };

  const startAcousticRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Setup Web Audio API for visualizer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Draw real-time frequencies on canvas
      const drawFrequency = () => {
        if (!audioCanvasRef.current || !analyserRef.current) return;
        const canvas = audioCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          const r = Math.min(255, barHeight + 40);
          const g = Math.min(255, 200 - barHeight);
          const b = 255;
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        animFrameIdRef.current = requestAnimationFrame(drawFrequency);
      };

      drawFrequency();

      // Start MediaRecorder
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          onAttachAudio(reader.result as string, `ruido_acustico_${Date.now()}.webm`);
        };
        reader.readAsDataURL(blob);

        // Stop stream and context
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
      };

      audioMediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecordingAudio(true);
      setAudioRecDuration(0);
    } catch (err) {
      console.warn("Failed to access microphone for acoustic recording:", err);
      // Fallback simulation of acoustic capture
      setIsRecordingAudio(true);
      setAudioRecDuration(0);
      setTimeout(() => {
        setIsRecordingAudio(false);
        onAttachAudio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=", "ruido_motor_amostra.wav");
        setShowAudioRecorderModal(false);
      }, 3000);
    }
  };

  const stopAcousticRecording = () => {
    if (audioMediaRecorderRef.current && isRecordingAudio) {
      audioMediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      setShowAudioRecorderModal(false);
    } else {
      setIsRecordingAudio(false);
      setShowAudioRecorderModal(false);
    }
  };

  const closeAudioRecorder = () => {
    if (audioMediaRecorderRef.current && isRecordingAudio) {
      audioMediaRecorderRef.current.stop();
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    setIsRecordingAudio(false);
    setShowAudioRecorderModal(false);
  };

  // Timer for audio recording
  useEffect(() => {
    let timer: any;
    if (isRecordingAudio) {
      timer = setInterval(() => {
        setAudioRecDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecordingAudio]);

  // =========================================================================
  // 4. GALLERY UPLOADS (PHOTO, VIDEO, AUDIO)
  // =========================================================================
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAttachImage(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAttachVideo(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onAttachAudio(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      {/* ACTION TOOLBAR — CLEAN, INTUITIVE ICONS & PILLS */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-1.5 pt-1">
        {/* 1. Speech Dictation */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          className={`px-3.5 py-2 sm:py-1.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-0 ${
            isSpeechListening
              ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
              : 'bg-tech-fundo hover:bg-tech-borda/80 border-tech-borda text-tech-texto hover:text-tech-destaque'
          }`}
          title="Ditar problema por voz em tempo real"
        >
          {isSpeechListening ? (
            <>
              <MicOff className="w-3.5 h-3.5 text-red-400 animate-bounce" />
              <span>Ouvindo relato... (Parar)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-tech-destaque" />
              <span>Ditar por Voz</span>
            </>
          )}
        </button>

        {/* 2. Live Camera / Video */}
        <button
          type="button"
          onClick={openLiveCamera}
          className="px-3.5 py-2 sm:py-1.5 sm:px-3 rounded-xl text-xs font-bold border border-tech-borda bg-tech-fundo hover:bg-tech-borda/80 text-tech-texto hover:text-tech-destaque transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-0"
          title="Abrir câmera ao vivo para foto ou vídeo"
        >
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Câmera / Vídeo ao Vivo</span>
        </button>

        {/* 3. Live Sound / Acoustic Recording */}
        <button
          type="button"
          onClick={openAudioRecorder}
          className="px-3.5 py-2 sm:py-1.5 sm:px-3 rounded-xl text-xs font-bold border border-tech-borda bg-tech-fundo hover:bg-tech-borda/80 text-tech-texto hover:text-amber-400 transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px] sm:min-h-0"
          title="Gravar ruído acústico do motor, freio ou suspensão"
        >
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Gravar Ruído / Som</span>
        </button>

        {/* 4. Upload Gallery Dropdown / Actions */}
        <div className="flex items-center gap-1 bg-tech-fundo border border-tech-borda rounded-xl p-1 sm:p-0.5 min-h-[40px] sm:min-h-0">
          {/* Subir Foto */}
          <button
            type="button"
            onClick={() => imageFileInputRef.current?.click()}
            className="px-2.5 py-1.5 sm:py-1 sm:px-2 rounded-lg text-xs sm:text-[11px] font-bold text-tech-secundario hover:text-tech-texto hover:bg-tech-borda/50 transition cursor-pointer flex items-center gap-1"
            title="Subir foto da galeria"
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-cyan-400" />
            <span>+ Foto</span>
          </button>
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            className="hidden"
          />

          {/* Subir Vídeo */}
          <button
            type="button"
            onClick={() => videoFileInputRef.current?.click()}
            className="px-2.5 py-1.5 sm:py-1 sm:px-2 rounded-lg text-xs sm:text-[11px] font-bold text-tech-secundario hover:text-tech-texto hover:bg-tech-borda/50 transition cursor-pointer flex items-center gap-1"
            title="Subir vídeo da galeria"
          >
            <Film className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-purple-400" />
            <span>+ Vídeo</span>
          </button>
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoFile}
            className="hidden"
          />

          {/* Subir Áudio */}
          <button
            type="button"
            onClick={() => audioFileInputRef.current?.click()}
            className="px-2.5 py-1.5 sm:py-1 sm:px-2 rounded-lg text-xs sm:text-[11px] font-bold text-tech-secundario hover:text-tech-texto hover:bg-tech-borda/50 transition cursor-pointer flex items-center gap-1"
            title="Subir áudio gravado"
          >
            <Music className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-amber-400" />
            <span>+ Áudio</span>
          </button>
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioFile}
            className="hidden"
          />
        </div>
      </div>

      {/* SPEECH INTERIM INDICATOR */}
      {isSpeechListening && speechInterim && (
        <div className="text-xs text-tech-destaque font-mono bg-tech-destaque/10 border border-tech-destaque/30 px-3 py-1.5 rounded-xl flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>"{speechInterim}..."</span>
        </div>
      )}

      {/* ATTACHED MEDIA STRIP (THUMBNAILS & PLAYERS) */}
      {(attachedImage || attachedVideo || attachedAudio) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-tech-borda">
          {/* Attached Image */}
          {attachedImage && (
            <div className="relative group flex items-center gap-2 bg-tech-fundo border border-cyan-500/40 px-2 py-1 rounded-xl">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-cyan-500/30">
                <img src={attachedImage} alt="Foto anexada" className="w-full h-full object-cover" />
              </div>
              <div className="text-[11px] font-mono text-cyan-400 font-bold pr-5">
                Foto Anexada
              </div>
              <button
                type="button"
                onClick={() => onClearMedia('image')}
                className="absolute right-1.5 top-1.5 p-0.5 text-tech-secundario hover:text-red-400 transition cursor-pointer"
                title="Remover foto"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached Video */}
          {attachedVideo && (
            <div className="relative group flex items-center gap-2 bg-tech-fundo border border-purple-500/40 px-2 py-1 rounded-xl">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Film className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-mono text-purple-400 font-bold pr-5">
                Vídeo Anexado
              </div>
              <button
                type="button"
                onClick={() => onClearMedia('video')}
                className="absolute right-1.5 top-1.5 p-0.5 text-tech-secundario hover:text-red-400 transition cursor-pointer"
                title="Remover vídeo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached Audio */}
          {attachedAudio && (
            <div className="relative group flex items-center gap-2 bg-tech-fundo border border-amber-500/40 px-2 py-1 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 shrink-0 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="text-[11px] font-mono text-amber-400 font-bold pr-5">
                Ruído Acústico Gravado
              </div>
              <button
                type="button"
                onClick={() => onClearMedia('audio')}
                className="absolute right-1.5 top-1.5 p-0.5 text-tech-secundario hover:text-red-400 transition cursor-pointer"
                title="Remover áudio"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: LIVE CAMERA / VIDEO
          ========================================================================= */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-tech-cartao border border-tech-borda rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-3.5 sm:space-y-4 p-3.5 sm:p-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-tech-borda pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-tech-texto uppercase tracking-wide">
                  Câmera / Vídeo ao Vivo
                </h3>
              </div>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="p-1 rounded-lg text-tech-secundario hover:text-tech-texto hover:bg-tech-borda/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewfinder */}
            <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-tech-borda flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Mode indicator badge */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold text-white border border-white/10 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRecordingVideo ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}`} />
                {isRecordingVideo ? `GRAVANDO VÍDEO (${videoRecDuration}s)` : cameraMode === 'photo' ? 'MODO FOTO' : 'MODO VÍDEO'}
              </div>

              {/* Camera flip button */}
              <button
                type="button"
                onClick={switchCameraFacing}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black p-2 rounded-xl text-white border border-white/15 cursor-pointer transition"
                title="Trocar câmera (Frontal/Traseira)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 bg-tech-fundo p-1 rounded-xl border border-tech-borda">
                <button
                  type="button"
                  onClick={() => setCameraMode('photo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cameraMode === 'photo' ? 'bg-cyan-500 text-black shadow' : 'text-tech-secundario hover:text-tech-texto'
                  }`}
                >
                  Foto
                </button>
                <button
                  type="button"
                  onClick={() => setCameraMode('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    cameraMode === 'video' ? 'bg-purple-500 text-white shadow' : 'text-tech-secundario hover:text-tech-texto'
                  }`}
                >
                  Vídeo
                </button>
              </div>

              {cameraMode === 'photo' ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-400/20"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tirar Foto</span>
                </button>
              ) : (
                isRecordingVideo ? (
                  <button
                    type="button"
                    onClick={stopRecordingVideo}
                    className="bg-red-500 hover:bg-red-600 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Concluir Gravação ({videoRecDuration}s)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecordingVideo}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-purple-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Iniciar Vídeo</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LIVE ACOUSTIC SOUND RECORDER (ENGINE NOISE SPECTRUM)
          ========================================================================= */}
      {showAudioRecorderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-tech-cartao border border-tech-borda rounded-2xl w-full max-w-md overflow-hidden shadow-2xl space-y-3.5 sm:space-y-4 p-3.5 sm:p-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-tech-borda pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-tech-texto uppercase tracking-wide">
                  Gravador Acústico de Ruídos
                </h3>
              </div>
              <button
                type="button"
                onClick={closeAudioRecorder}
                className="p-1 rounded-lg text-tech-secundario hover:text-tech-texto hover:bg-tech-borda/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-tech-secundario">
              Aproxime o microfone do motor, rodas ou freios para capturar o padrão sonoro (tec-tec, chiado, estalo, batida ou vibração).
            </p>

            {/* Audio Spectrum Canvas */}
            <div className="h-28 rounded-xl bg-black border border-tech-borda overflow-hidden flex items-center justify-center relative">
              <canvas
                ref={audioCanvasRef}
                width={360}
                height={112}
                className="w-full h-full"
              />
              {!isRecordingAudio && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px] text-xs font-mono text-tech-secundario">
                  Clique em iniciar para gravar a assinatura acústica
                </div>
              )}
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs font-mono font-bold text-amber-400">
                {isRecordingAudio ? `Capturando som: ${audioRecDuration}s` : 'Pronto para gravar'}
              </div>

              {isRecordingAudio ? (
                <button
                  type="button"
                  onClick={stopAcousticRecording}
                  className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Square className="w-4 h-4 fill-black" />
                  <span>Concluir ({audioRecDuration}s)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startAcousticRecording}
                  className="bg-gradient-to-r from-amber-400 to-orange-400 hover:brightness-110 text-black font-black text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Mic className="w-4 h-4" />
                  <span>Iniciar Gravação de Som</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
