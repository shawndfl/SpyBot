let frameID = -1;
export const SNES_WIDTH = 256;
export const SNES_HEIGHT = 224;

export default class Engine {
  constructor(layers = [], opts) {
    this.layers = layers;
    this.fps = opts.fps;
    this.aspectRatio = opts.aspectRatio;
    this.frameSkip = opts.frameSkip;
    this.alpha = opts.alpha;
    this.canvas = opts.canvas;
    this.tick = 0;
    this.image = new Image();
    this.elapsed = 0;
    this.context = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  initialize() {
    const canvas = this.canvas;
    const context = this.context;
    if (this.layers[0].entry && !this.layers[1].entry) {
      this.alpha[0] = 1;
      this.alpha[1] = 0;
    }
    if (!this.layers[0].entry && this.layers[1].entry) {
      this.alpha[0] = 0;
      this.alpha[1] = 1;
    }
    context.imageSmoothingEnabled = false;
    canvas.width = SNES_WIDTH;
    canvas.height = SNES_HEIGHT;
  }

  update(dt) {
    const fpsInterval = 1000 / this.fps;
    this.elapsed += dt;
    let bitmap;
    const canvas = this.canvas;
    const context = this.context;
    const image = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    if (this.elapsed > fpsInterval) {
      this.elapsed = 0;
      for (let i = 0; i < this.layers.length; ++i) {
        this.image.src = canvas.toDataURL();
        bitmap = this.layers[i].overlayFrame(image.data, this.aspectRatio, this.tick, this.alpha[i], i === 0);
      }
      this.tick += this.frameSkip;
      image.data.set(bitmap);
      context.putImageData(image, 0, 0);
    }
  }
}
