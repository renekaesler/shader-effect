import {
  createBufferInfoFromArrays,
  drawBufferInfo,
  createProgramInfo,
  setBuffersAndAttributes,
  setUniforms,
  createTextures
} from "twgl.js";

import { loadImage } from "./utils/image";
import defaultShaders from "./default-shaders";


class ShaderEffect extends HTMLCanvasElement {
  #vertexShader;
  #fragmentShader;

  constructor() {
    super();

    if(!this.dataset.context) {
      this.dataset.context = 'webgl2';
    }

    this.gl = this.getContext(this.dataset.context);
  }


  get vertexShader() {
    const { vertexShader } = defaultShaders[this.dataset.context];
    return this.#vertexShader || vertexShader;
  }

  set vertexShader(shader) {
    this.#vertexShader = shader;
  }


  get fragmentShader() {
    const { fragmentShader } = defaultShaders[this.dataset.context];
    return this.#fragmentShader || fragmentShader;
  }

  set fragmentShader(shader) {
    this.#fragmentShader = shader;
  }


  connectedCallback() {
    this.dispatchEvent(new Event('connected'));
  }


  run() {
    cancelAnimationFrame(this.animationId);

    setTimeout(async () => {
      await this.#setup();

      this.startedAt = performance.now();
      this.animationId = requestAnimationFrame(this.#animationLoop);
    }, this.delay);
  }


  clear() {
    const { gl } = this;
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
  }


  async #setup() {
    const { gl } = this;

    this.programInfo = createProgramInfo(gl, [
      this.vertexShader, 
      this.fragmentShader
    ]);

    this.bufferInfo = createBufferInfoFromArrays(gl, {
      position: {
        numComponents: 2,
        data: [
          1.0,  1.0,
         -1.0,  1.0,
          1.0, -1.0,
         -1.0, -1.0
       ]
      }
    });

    const [img, charactersImg] = await Promise.all([
      loadImage(this.imageSrc),
      loadImage(this.charactersSrc)
    ]);

    if (!this.hasAttribute('width') || !this.hasAttribute('height')) {
      this.width = img.naturalWidth;
      this.height = img.naturalHeight;
    }

    gl.useProgram(this.programInfo.program);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    );

    const smoothness = this.smoothness ?? 0.2;
    const characterScaling = this.characterScaling ?? 1.0

    setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
    setUniforms(this.programInfo, {
      smoothness,
      characterSize: [
        (charactersImg.width * characterScaling * 0.5 ) / this.width,
        (charactersImg.height * characterScaling) / this.height
      ],
      ...createTextures(gl, {
        image: { src: this.imageSrc, flipY: 1 },
        characters: { src: this.charactersSrc,  internalFormat: gl.LUMIANCE }
      })
    });
  }


  #animationLoop = (time) => {
    const { gl } = this;

    const elapsed = Math.max(0, time - this.startedAt);
    const progress = Math.min(elapsed / this.duration, 1);

    this.clear();   
    setUniforms(this.programInfo, { progress });
    drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE_STRIP);

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.#animationLoop)
    }
  }
}

customElements.define('shader-effect', ShaderEffect, { extends: 'canvas' });
