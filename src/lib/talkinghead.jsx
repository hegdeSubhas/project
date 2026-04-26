/**
 * TalkingHead Avatar Module
 * Provides a talking avatar with text-to-speech capabilities using Web Speech API
 */

class TalkingHead {
  constructor(container, options = {}) {
    // Handle both constructor patterns
    if (typeof container === 'object' && container.container) {
      // If first param is options with container property
      this.container = container.container;
      this.options = container;
    } else {
      // If first param is the container element
      this.container = container;
      this.options = options;
    }

    this.options = {
      body: this.options.body || 'F', // 'M' for male, 'F' for female
      url: this.options.url || null, // Avatar image URL
      voiceURI: this.options.voiceURI || 'Google UK English Female',
      speechRate: this.options.speechRate || 0.9,
      ...this.options
    };

    this.synth = window.speechSynthesis;
    this.isInitialized = false;
    this.isCurrentlySpeaking = false;
    this.avatarElement = null;
    this.avatarContainer = null;

    this.init();
  }

  init() {
    try {
      // Clear existing content in the container only if it exists
      if (this.container && this.container.childNodes.length > 0) {
        // Only clear if we haven't already initialized
        if (!this.isInitialized) {
          Array.from(this.container.childNodes).forEach(child => {
            if (child.id === 'talkinghead-container') {
              this.container.removeChild(child);
            }
          });
        }
      }

      // Create avatar container
      this.avatarContainer = document.createElement('div');
      this.avatarContainer.id = 'talkinghead-container';
      this.avatarContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        position: relative;
        overflow: hidden;
      `;

      // Create avatar element
      this.avatarElement = document.createElement('div');
      this.avatarElement.id = 'talkinghead-avatar';
      this.avatarElement.style.cssText = `
        width: 300px;
        height: 400px;
        background: ${this.options.body === 'M' ? '#d4a574' : '#d4a574'};
        border-radius: 50% 50% 45% 45%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 120px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      `;

      // Add emoji avatar (emoji face that changes when speaking)
      const emoji = document.createElement('span');
      emoji.id = 'avatar-emoji';
      emoji.textContent = this.options.body === 'M' ? '👨' : '👩';
      emoji.style.cssText = `
        font-size: 150px;
        transition: transform 0.1s ease;
      `;

      this.avatarElement.appendChild(emoji);

      // Add speaking indicator
      const speakingIndicator = document.createElement('div');
      speakingIndicator.id = 'speaking-indicator';
      speakingIndicator.style.cssText = `
        position: absolute;
        bottom: 20px;
        width: 60px;
        height: 20px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 10px;
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
        padding: 0 10px;
      `;

      // Create sound wave bars
      for (let i = 0; i < 3; i++) {
        const bar = document.createElement('div');
        bar.style.cssText = `
          width: 4px;
          height: 12px;
          background: white;
          border-radius: 2px;
          animation: none;
        `;
        speakingIndicator.appendChild(bar);
      }

      this.avatarElement.appendChild(speakingIndicator);

      // Add CSS animations if not already added
      if (!document.getElementById('talkinghead-styles')) {
        const style = document.createElement('style');
        style.id = 'talkinghead-styles';
        style.textContent = `
          @keyframes soundWave {
            0%, 100% { height: 12px; }
            50% { height: 24px; }
          }
          
          #talkinghead-container.speaking #speaking-indicator div {
            animation: soundWave 0.4s ease-in-out infinite;
          }
          
          #talkinghead-container.speaking #avatar-emoji {
            transform: scaleY(1.1);
          }
        `;
        document.head.appendChild(style);
      }

      // Append to container
      this.avatarContainer.appendChild(this.avatarElement);
      
      if (this.container) {
        this.container.appendChild(this.avatarContainer);
      }

      this.isInitialized = true;
      console.log('TalkingHead initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TalkingHead:', error);
    }
  }

  /**
   * Show/load the avatar
   * @param {object} config - Avatar configuration
   */
  async showAvatar(config = {}) {
    try {
      // Update avatar settings
      if (config.body) {
        this.options.body = config.body;
      }
      if (config.url) {
        this.options.url = config.url;
      }
      if (config.avatarMood) {
        this.options.avatarMood = config.avatarMood;
      }

      // Re-initialize with new settings if needed
      if (!this.isInitialized) {
        this.init();
      }

      return Promise.resolve();
    } catch (error) {
      console.error('Error showing avatar:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Make the avatar speak text (alias for speak method)
   * @param {string} text - The text to speak
   */
  speakText(text) {
    this.speak(text, {
      voiceURI: this.options.voiceURI,
      rate: this.options.speechRate || 0.9,
    });
  }

  /**
   * Make the avatar speak
   * @param {string} text - The text to speak
   * @param {object} options - Additional options (voice, pitch, rate, etc.)
   */
  speak(text, options = {}) {
    if (!this.isInitialized) {
      console.warn('TalkingHead not initialized');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || this.options.speechRate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;

    // Try to set the specific voice
    const voiceURI = options.voiceURI || this.options.voiceURI;
    if (voiceURI) {
      const voices = this.synth.getVoices();
      const selectedVoice = voices.find(v => v.name === voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      this.isCurrentlySpeaking = true;
      if (this.avatarContainer) {
        this.avatarContainer.classList.add('speaking');
      }
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      this.isCurrentlySpeaking = false;
      if (this.avatarContainer) {
        this.avatarContainer.classList.remove('speaking');
      }
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      this.isCurrentlySpeaking = false;
      if (this.avatarContainer) {
        this.avatarContainer.classList.remove('speaking');
      }
      if (options.onError) options.onError(event.error);
    };

    this.synth.speak(utterance);
  }

  /**
   * Stop the avatar from speaking
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isCurrentlySpeaking = false;
    if (this.avatarContainer) {
      try {
        this.avatarContainer.classList.remove('speaking');
      } catch (error) {
        console.warn('Error removing speaking class:', error);
      }
    }
  }

  /**
   * Check if avatar is currently speaking
   */
  isSpeaking() {
    return this.isCurrentlySpeaking;
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * Destroy the avatar
   */
  destroy() {
    this.stop();
    if (this.avatarContainer && this.avatarContainer.parentNode) {
      try {
        this.avatarContainer.parentNode.removeChild(this.avatarContainer);
      } catch (error) {
        console.warn('Error removing avatar container:', error);
        // If removeChild fails, try removing it directly
        if (this.avatarContainer.parentNode) {
          this.avatarContainer.parentNode.innerHTML = '';
        }
      }
    }
    this.avatarContainer = null;
    this.avatarElement = null;
    this.isInitialized = false;
  }
}

export { TalkingHead };
