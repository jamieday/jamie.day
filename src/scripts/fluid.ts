/**
 * Advanced Fluid Cursor Effect
 * Creates a beautiful, complex fluid visual effect that follows the user's cursor
 */
export default class FluidCursor {
  private canvas: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private debug: boolean = false;
  private mouse: { x: number; y: number } = { x: 0, y: 0 };
  private lastMouse: { x: number; y: number } = { x: 0, y: 0 };
  private devicePixelRatio: number = window.devicePixelRatio || 1;
  private animationFrameId: number | null = null;
  private particles: Particle[] = [];
  private maxParticles: number = 500; // Reduced for better performance
  private hueBase: number = 210; // Base blue color

  // Track mouse velocity for dynamic effects
  private mouseVelocity: { x: number; y: number } = { x: 0, y: 0 };

  private log(message: string): void {
    if (this.debug) {
      console.log(`[FluidCursor] ${message}`);
    }
  }

  constructor() {
    this.log('Initializing FluidCursor');

    this.canvas = document.getElementById('fluid') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Fluid canvas element not found');
      return;
    }

    const context = this.canvas.getContext('2d', { alpha: true });
    if (!context) {
      console.error('Could not get 2D context from canvas');
      return;
    }
    this.ctx = context;

    this.resizeCanvas();
    this.setupEventListeners();
    this.startAnimation();
  }

  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth * this.devicePixelRatio;
    this.canvas.height = window.innerHeight * this.devicePixelRatio;
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resizeCanvas());

    window.addEventListener('mousemove', (e) => {
      // Store last position to calculate velocity
      this.lastMouse.x = this.mouse.x;
      this.lastMouse.y = this.mouse.y;

      // Update current position
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      // Calculate velocity
      this.mouseVelocity.x = this.mouse.x - this.lastMouse.x;
      this.mouseVelocity.y = this.mouse.y - this.lastMouse.y;

      // Create particles based on movement
      const speed = Math.sqrt(
        this.mouseVelocity.x * this.mouseVelocity.x +
          this.mouseVelocity.y * this.mouseVelocity.y,
      );

      // Create more particles when moving faster
      const particlesToCreate = Math.min(5, Math.floor(speed / 3) + 1);

      for (let i = 0; i < particlesToCreate; i++) {
        this.createParticle();
      }
    });

    // Add click event for particle explosion
    window.addEventListener('click', (e) => {
      // Create explosion at click position
      this.createExplosion(e.clientX, e.clientY);
    });

    // Add input event listeners to all text inputs and contenteditable elements
    this.setupTextInputListeners();
  }

  // Throttle function to limit how often a function can be called
  private throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        func(...args);
      }
    };
  }

  private setupTextInputListeners(): void {
    // Function to add listeners to an element
    const addListeners = (element: HTMLElement) => {
      // Create a throttled version of the particle creation function
      // This limits how often particles are created during rapid typing
      const throttledCreateParticles = this.throttle((e: KeyboardEvent) => {
        // Skip if it's a special key (backspace, delete, arrows, etc.)
        if (
          e.key === 'Backspace' ||
          e.key === 'Delete' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'Home' ||
          e.key === 'End' ||
          e.key === 'Tab' ||
          e.key === 'Escape' ||
          e.key === 'Enter' ||
          e.metaKey || // Command key (Mac)
          e.ctrlKey // Control key
        ) {
          return;
        }

        // Only proceed if it's a typing key (single character)
        if (e.key.length === 1) {
          // Use setTimeout to defer the heavy computation to after the key input is processed
          setTimeout(() => {
            const caretPos = this.getCaretPosition(element);
            if (caretPos) {
              this.createTypingParticles(caretPos.x, caretPos.y);
            }
          }, 0);
        }
      }, 16); // Throttle to roughly 60fps (1000ms / 60 ≈ 16ms)

      // Add the throttled event listener
      element.addEventListener('keydown', throttledCreateParticles);
    };

    // Find all input and textarea elements
    document
      .querySelectorAll(
        'input[type="text"], textarea, [contenteditable="true"]',
      )
      .forEach((el) => {
        addListeners(el as HTMLElement);
      });

    // Special handling for the console input in this specific app
    const consoleInput = document.getElementById('jm-console-input');
    if (consoleInput) {
      addListeners(consoleInput as HTMLElement);
    }
  }

  // Static canvas for text measurement to improve performance
  private static textCanvas: HTMLCanvasElement | null = null;
  private static textContext: CanvasRenderingContext2D | null = null;

  // Helper method to get accurate text width with performance optimization
  private getTextWidth(input: HTMLInputElement | HTMLTextAreaElement): number {
    // Create canvas only once and reuse it
    if (!FluidCursor.textCanvas) {
      FluidCursor.textCanvas = document.createElement('canvas');
      FluidCursor.textContext = FluidCursor.textCanvas.getContext('2d');
    }

    if (!FluidCursor.textContext) {
      return input.value.length * 8; // Fallback if canvas context not available
    }

    // Get the computed style of the input element
    const style = window.getComputedStyle(input);

    // Set the font properties to match the input
    FluidCursor.textContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    // Measure the text width
    const text = input.value.substring(0, input.selectionStart || 0);
    const metrics = FluidCursor.textContext.measureText(text);

    // Return the width
    return metrics.width;
  }

  private getCaretPosition(
    element: HTMLElement,
  ): { x: number; y: number } | null {
    let x = 0,
      y = 0;

    // Get element's position
    const rect = element.getBoundingClientRect();

    const TRAIL_OFFSET = 17;
    const Y_OFFSET = -3;

    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      // Get the text width up to the caret position
      const textWidth = this.getTextWidth(element);

      // Calculate the x position based on the text width
      x = rect.left + Math.min(textWidth, rect.width - 5) + 20;

      // Offset slightly to the left for the trail effect
      x -= TRAIL_OFFSET;

      // Position at the bottom for an underline effect
      y = rect.bottom + Y_OFFSET;
    } else {
      // For contenteditable elements
      x = rect.left + rect.width / 2;
      x -= TRAIL_OFFSET;
      y = rect.bottom + Y_OFFSET;
    }

    return { x, y };
  }

  private createTypingParticles(x: number, y: number): void {
    // Number of tiny particles to create
    const particleCount = 3 + Math.floor(Math.random() * 3); // More particles for a more visible effect

    for (let i = 0; i < particleCount; i++) {
      // Create particles with a horizontal spread to create a typing trail effect
      // Particles should appear in a small area to the left of the caret
      const offsetX = -3 - Math.random() * 8; // Negative offset to create trail to the left
      const offsetY = Math.random() * 2; // Only positive offset for underline effect

      const particleX = x + offsetX;
      const particleY = y + offsetY;

      // Particles should move slightly leftward to enhance the trail effect
      const vx = -0.2 - Math.random() * 0.3; // Leftward movement
      const vy = Math.random() * 0.1; // Slight downward drift for underline effect

      // Create very small particles
      const size = 0.3 + Math.random() * 0.8; // Smaller particles for underline

      // Calculate hue within blue range with slight variation
      const hue = this.hueBase + (Math.random() - 0.5) * 20;

      // Add the tiny typing particle
      this.particles.push({
        x: particleX,
        y: particleY,
        size,
        vx,
        vy,
        hue,
        saturation: 70 + Math.random() * 20,
        lightness: 70 + Math.random() * 20, // Brighter
        alpha: 0.2 + Math.random() * 0.3, // More transparent
        decay: (0.02 + Math.random() * 0.02) / 3, // 3x slower decay as requested
        life: 1.0,
      });
    }
  }

  private createExplosion(x: number, y: number): void {
    // Number of particles to create in the explosion
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      // Calculate a random angle for the particle
      const angle = Math.random() * Math.PI * 2;

      // Calculate random speed for the particle
      const speed = 2 + Math.random() * 4;

      // Calculate velocity based on angle and speed
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Create slightly larger particles for the explosion
      const size = 3 + Math.random() * 7;

      // Calculate hue within blue range with slight variation
      const hue = this.hueBase + (Math.random() - 0.5) * 40;

      // Add the explosion particle
      this.particles.push({
        x,
        y,
        size,
        vx,
        vy,
        hue,
        saturation: 70 + Math.random() * 20,
        lightness: 60 + Math.random() * 20,
        alpha: 0.4 + Math.random() * 0.4,
        decay: 0.01 + Math.random() * 0.02, // Slightly faster decay
        life: 1.0,
      });
    }
  }

  private createParticle(): void {
    // Only create particles if we're under the limit
    if (this.particles.length >= this.maxParticles) {
      // Remove oldest particle
      this.particles.shift();
    }

    // Calculate size based on mouse velocity
    const speed = Math.sqrt(
      this.mouseVelocity.x * this.mouseVelocity.x +
        this.mouseVelocity.y * this.mouseVelocity.y,
    );

    // Smaller particles for a more delicate effect
    const size = Math.min(10, Math.max(2, speed / 3 + 2));

    // Create particle with random offset from cursor
    const offset = 3; // Smaller offset for more precise placement
    const x = this.mouse.x + (Math.random() - 0.5) * offset;
    const y = this.mouse.y + (Math.random() - 0.5) * offset;

    // Create velocity based on mouse movement with some randomness
    // Natural movement that follows the cursor
    const vx = this.mouseVelocity.x * 0.3 + (Math.random() - 0.5) * 0.5;
    const vy = this.mouseVelocity.y * 0.3 + (Math.random() - 0.5) * 0.5;

    // Calculate hue within blue range (200-240)
    const hue = this.hueBase + (Math.random() - 0.5) * 40; // Blue range

    // Create particle with properties for a subtle, fire-like effect
    this.particles.push({
      x,
      y,
      size,
      vx,
      vy,
      hue,
      saturation: 70 + Math.random() * 20, // Less variance
      lightness: 60 + Math.random() * 20, // Brighter for blue fire effect
      alpha: 0.3 + Math.random() * 0.3, // More transparent
      decay: 0.005 + Math.random() * 0.01, // Slower decay for longer trails
      life: 1.0,
    });
  }

  private draw(): void {
    // Clear canvas with transparent fill to allow trails to fade naturally
    this.ctx.clearRect(
      0,
      0,
      this.canvas.width / this.devicePixelRatio,
      this.canvas.height / this.devicePixelRatio,
    );

    // Batch similar particles for better performance
    const batchSize = 20;
    let currentBatch: Particle[] = [];
    let currentHue = -1;
    let currentSize = -1;

    // Update and prepare particles for drawing
    const particlesToDraw: Particle[] = [];
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx;
      p.y += p.vy;

      // Apply natural friction without upward bias
      p.vx *= 0.96;
      p.vy *= 0.96;

      // Reduce life
      p.life -= p.decay;

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Add to particles to draw
      particlesToDraw.push(p);
    }

    // Sort particles by hue for better batching
    particlesToDraw.sort((a, b) => a.hue - b.hue);

    // Draw particles with batching for better performance
    for (const p of particlesToDraw) {
      // Calculate size and alpha based on life
      const currentSize = p.size * (p.life * 0.8 + 0.2); // Less size reduction
      const currentAlpha = p.alpha * p.life;

      // Draw particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);

      // Set shadow only occasionally for better performance
      if (Math.random() > 0.7) {
        this.ctx.shadowBlur = currentSize * 1.5;
        this.ctx.shadowColor = `hsla(${p.hue}, ${p.saturation}%, ${
          p.lightness
        }%, ${currentAlpha * 0.3})`;
      } else {
        this.ctx.shadowBlur = 0;
      }

      // Blue color
      this.ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${currentAlpha})`;
      this.ctx.fill();
    }

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(() => this.draw());
  }

  public startAnimation(): void {
    if (this.animationFrameId === null) {
      this.draw();
    }
  }

  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

// Particle interface
interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  decay: number;
  life: number;
}
