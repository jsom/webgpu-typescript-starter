import shader from "./shader.wgsl";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

async function initialize(): Promise<void> {
  // Check for WebGPU support first by seeing if navigator.gpu exists.
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported.");
  }

  // WebGPU apps start by getting an Adapter, which represents a physical GPU.
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU adapter creation failed.");
  }

  // From the adapter, you get a Device, which is the primary WebGPU interface.
  const device = await adapter.requestDevice();

  // Devices on their own don't display anything on the page. You need to
  // configure a canvas context as the output surface.
  const context = canvas.getContext("webgpu");
  if (!context) {
    throw new Error("WebGPU context creation failed.");
  }

  // Mobile and desktop devices have different formats they prefer to output,
  // so usually you'll want to use the "preferred format" for you platform,
  // as queried from navigator.gpu.
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format
  });

  // Shaders are written in a language called WGSL.
  const shaderModule = device.createShaderModule({
    code: shader,
  });

  // Pipelines bundle most of the render state (like primitive types, blend
  // modes, etc) and shader entry points into one big object.
  const pipeline = device.createRenderPipeline({
    // All pipelines need a layout, but if you don't need to share data between
    // pipelines you can use the 'auto' layout to have it generate one for you!
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain',
      // `buffers` describes the layout of the attributes in the vertex buffers.
      buffers: [{
        arrayStride: 28, // Bytes per vertex (3 floats + 4 floats)
        attributes: [{
          shaderLocation: 0, // VertexIn.pos in the shader
          offset: 0, // Starts at the beginning of the buffer
          format: 'float32x3' // Data is 3 floats
        }, {
          shaderLocation: 1, // VertexIn.color in the shader
          offset: 12, // Starts 12 bytes (3 floats) in to the buffer
          format: 'float32x4' // Data is 4 floats
        }]
      }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      // `targets` indicates the format of each render target this pipeline
      // outputs to. It must match the colorAttachments of any renderPass it's
      // used with.
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
      }],
    },
  });

  // It's easiest to specify vertex data with TypedArrays, like a Float32Array
  // You are responsible for making sure the layout of the data matches the
  // layout that you describe in the pipeline `buffers`.
  const vertexData = new Float32Array([
    // X,  Y, Z   R, G, B, A,
    0, 1, 1, 1, 0, 0, 1,
    -1, -1, 1, 0, 1, 0, 1,
    1, -1, 1, 0, 0, 1, 1,
  ]);
  const vertexBuffer = device.createBuffer({
    // Buffers are given a size in bytes at creation that can't be changed.
    size: vertexData.byteLength,
    // Usage defines what this buffer can be used for
    // VERTEX = Can be passed to setVertexBuffer()
    // COPY_DST = You can write or copy data into it after creation
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // writeBuffer is the easiest way to TypedArray data into a buffer.
  device.queue.writeBuffer(vertexBuffer, 0, vertexData);

  // Command encoders record commands for the GPU to execute.
  const commandEncoder = device.createCommandEncoder();

  // All rendering commands happen in a render pass.
  const passEncoder = commandEncoder.beginRenderPass({
    // Render passes are given attachments to write into.
    colorAttachments: [{
      // By using a texture from the canvas context configured above as the
      // attachment, anything drawn in the pass will display in the canvas.
      view: context.getCurrentTexture().createView(),
      // Clear the attachment when the render pass starts.
      loadOp: 'clear',
      // The color the attachment will be cleared to.
      clearValue: [0, 0, 0.2, 1],
      // When the pass is done, save the results in the attachment texture.
      storeOp: 'store',
    }]
  });

  // Set the pipeline to use when drawing.
  passEncoder.setPipeline(pipeline);
  // Set the vertex buffer to use when drawing.
  // The `0` corresponds to the index of the `buffers` array in the pipeline.
  passEncoder.setVertexBuffer(0, vertexBuffer);
  // Draw 3 vertices using the previously set pipeline and vertex buffer.
  passEncoder.draw(3);

  // End the render pass.
  passEncoder.end();

  // Finish recording commands, which creates a command buffer.
  const commandBuffer = commandEncoder.finish();

  // Command buffers don't execute right away, you have to submit them to the
  // device queue.
  device.queue.submit([commandBuffer]);
}

initialize();