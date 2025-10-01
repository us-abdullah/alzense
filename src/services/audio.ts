export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationFrame: number | null = null;
  private onNoiseUpdate: ((noiseLevel: number) => void) | null = null;

  constructor(onNoiseUpdate: (noiseLevel: number) => void) {
    this.onNoiseUpdate = onNoiseUpdate;
  }

  async startRecording(): Promise<boolean> {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(stream);

      // Configure analyser
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.microphone.connect(this.analyser);

      // Create data array
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Start monitoring
      this.monitorNoiseLevel();

      return true;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      return false;
    }
  }

  stopRecording(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.dataArray = null;
  }

  private monitorNoiseLevel(): void {
    if (!this.analyser || !this.dataArray) return;

    const updateNoiseLevel = () => {
      this.analyser!.getByteFrequencyData(this.dataArray!);
      
      // Calculate RMS (Root Mean Square) for noise level
      let sum = 0;
      for (let i = 0; i < this.dataArray!.length; i++) {
        sum += this.dataArray![i] * this.dataArray![i];
      }
      const rms = Math.sqrt(sum / this.dataArray!.length);
      
      // Convert to decibels (approximate)
      const noiseLevel = rms > 0 ? 20 * Math.log10(rms / 255) + 60 : 0;
      
      this.onNoiseUpdate?.(Math.max(0, noiseLevel));
      
      this.animationFrame = requestAnimationFrame(updateNoiseLevel);
    };

    updateNoiseLevel();
  }

  // Get current noise level without continuous monitoring
  async getCurrentNoiseLevel(): Promise<number> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      return new Promise((resolve) => {
        const getNoiseLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const noiseLevel = rms > 0 ? 20 * Math.log10(rms / 255) + 60 : 0;
          
          // Clean up
          microphone.disconnect();
          analyser.disconnect();
          audioContext.close();
          stream.getTracks().forEach(track => track.stop());
          
          resolve(Math.max(0, noiseLevel));
        };

        // Wait a bit for the analyser to collect data
        setTimeout(getNoiseLevel, 100);
      });
    } catch (error) {
      console.error('Failed to get noise level:', error);
      return 0;
    }
  }

  // Convert noise level to human-readable description
  static getNoiseDescription(noiseLevel: number): string {
    if (noiseLevel < 30) return 'Very Quiet';
    if (noiseLevel < 40) return 'Quiet';
    if (noiseLevel < 50) return 'Moderate';
    if (noiseLevel < 60) return 'Loud';
    if (noiseLevel < 70) return 'Very Loud';
    return 'Extremely Loud';
  }

  // Check if noise level is potentially stressful
  static isStressfulNoise(noiseLevel: number): boolean {
    return noiseLevel > 60; // Above 60dB is considered potentially stressful
  }
}
