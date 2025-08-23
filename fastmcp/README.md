# FastMCP

A TypeScript framework for building [MCP](https://glama.ai/mcp) servers capable of handling client sessions.

> [!NOTE]
>
> For a Python implementation, see [FastMCP](https://github.com/jlowin/fastmcp).

## Features

- Simple Tool, Resource, Prompt definition
- [Authentication](#authentication)
- [Passing headers through context](#passing-headers-through-context)
- [Sessions](#sessions)
- [Image content](#returning-an-image)
- [Audio content](#returning-an-audio)
- [Embedded](#embedded-resources)
- [Logging](#logging)
- [Error handling](#errors)
- [HTTP Streaming](#http-streaming) (with SSE compatibility)
- [Stateless mode](#stateless-mode) for serverless deployments
- CORS (enabled by default)
- [Progress notifications](#progress)
- [Streaming output](#streaming-output)
- [Typed server events](#typed-server-events)
- [Prompt argument auto-completion](#prompt-argument-auto-completion)
- [Sampling](#requestsampling)
- [Configurable ping behavior](#configurable-ping-behavior)
- [Health-check endpoint](#health-check-endpoint)
- [Roots](#roots-management)
- CLI for [testing](#test-with-mcp-cli) and [debugging](#inspect-with-mcp-inspector)

## When to use FastMCP over the official SDK?

FastMCP is built on top of the official SDK.

The official SDK provides foundational blocks for building MCPs, but leaves many implementation details to you:

- [Initiating and configuring](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L664-L744) all the server components
- [Handling of connections](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L760-L850)
- [Handling of tools](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L1303-L1498)
- [Handling of responses](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L989-L1060)
- [Handling of resources](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L1151-L1242)
- Adding [prompts](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L760-L850), [resources](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L960-L962), [resource templates](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L964-L987)
- Embedding [resources](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L1569-L1643), [image](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L51-L111) and [audio](https://github.com/punkpeye/fastmcp/blob/06c2af7a3d7e3d8c638deac1964ce269ce8e518b/src/FastMCP.ts#L113-L173) content blocks

FastMCP eliminates this complexity by providing an opinionated framework that:

- Handles all the boilerplate automatically
- Provides simple, intuitive APIs for common tasks
- Includes built-in best practices and error handling
- Lets you focus on your MCP's core functionality

**When to choose FastMCP:** You want to build MCP servers quickly without dealing with low-level implementation details.

**When to use the official SDK:** You need maximum control or have specific architectural requirements. In this case, we encourage referencing FastMCP's implementation to avoid common pitfalls.

## Installation

```bash
npm install fastmcp
```

## Quickstart

> [!NOTE]
>
> There are many real-world examples of using FastMCP in the wild. See the [Showcase](#showcase) for examples.

```ts
import { FastMCP } from "fastmcp";
import { z } from "zod"; // Or any validation library that supports Standard Schema

const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
});

server.addTool({
  name: "add",
  description: "Add two numbers",
  parameters: z.object({
    a: z.number(),
    b: z.number(),
  }),
  execute: async (args) => {
    return String(args.a + args.b);
  },
});

server.start({
  transportType: "stdio",
});
```

_That's it!_ You have a working MCP server.

You can test the server in terminal with:

```bash
git clone https://github.com/punkpeye/fastmcp.git
cd fastmcp

pnpm install
pnpm build

# Test the addition server example using CLI:
npx fastmcp dev src/examples/addition.ts
# Test the addition server example using MCP Inspector:
npx fastmcp inspect src/examples/addition.ts
```

If you are looking for a boilerplate repository to build your own MCP server, check out [fastmcp-boilerplate](https://github.com/punkpeye/fastmcp-boilerplate).

### Remote Server Options

FastMCP supports multiple transport options for remote communication, allowing an MCP hosted on a remote machine to be accessed over the network.

#### HTTP Streaming

[HTTP streaming](https://www.cloudflare.com/learning/video/what-is-http-live-streaming/) provides a more efficient alternative to SSE in environments that support it, with potentially better performance for larger payloads.

You can run the server with HTTP streaming support:

```ts
server.start({
  transportType: "httpStream",
  httpStream: {
    port: 8080,
  },
});
```

This will start the server and listen for HTTP streaming connections on `http://localhost:8080/mcp`.

> **Note:** You can also customize the endpoint path using the `httpStream.endpoint` option (default is `/mcp`).

You can connect to these servers using the appropriate client transport.

For HTTP streaming connections:

```ts
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

const transport = new StreamableHTTPClientTransport(
  new URL(`http://localhost:8080/mcp`),
);

await client.connect(transport);
```

For SSE connections:

```ts
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

const transport = new SSEClientTransport(new URL(`http://localhost:8080/sse`));

await client.connect(transport);
```

#### Stateless Mode

FastMCP supports stateless operation for HTTP streaming, where each request is handled independently without maintaining persistent sessions. This is ideal for serverless environments, load-balanced deployments, or when session state isn't required.

In stateless mode:

- No sessions are tracked on the server
- Each request creates a temporary session that's discarded after the response
- Reduced memory usage and better scalability
- Perfect for stateless deployment environments

You can enable stateless mode by adding the `stateless: true` option:

```ts
server.start({
  transportType: "httpStream",
  httpStream: {
    port: 8080,
    stateless: true,
  },
});
```

> **Note:** Stateless mode is only available with HTTP streaming transport. Features that depend on persistent sessions (like session-specific state) will not be available in stateless mode.

You can also enable stateless mode using CLI arguments or environment variables:

```bash
# Via CLI argument
npx fastmcp dev src/server.ts --transport http-stream --port 8080 --stateless true

# Via environment variable
FASTMCP_STATELESS=true npx fastmcp dev src/server.ts
```

The `/ready` health check endpoint will indicate when the server is running in stateless mode:

```json
{
  "mode": "stateless",
  "ready": 1,
  "status": "ready",
  "total": 1
}
```

## Core Concepts

### Tools

[Tools](https://modelcontextprotocol.io/docs/concepts/tools) in MCP allow servers to expose executable functions that can be invoked by clients and used by LLMs to perform actions.

FastMCP uses the [Standard Schema](https://standardschema.dev) specification for defining tool parameters. This allows you to use your preferred schema validation library (like Zod, ArkType, or Valibot) as long as it implements the spec.

**Zod Example:**

```typescript
import { z } from "zod";

server.addTool({
  name: "fetch-zod",
  description: "Fetch the content of a url (using Zod)",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return await fetchWebpageContent(args.url);
  },
});
```

**ArkType Example:**

```typescript
import { type } from "arktype";

server.addTool({
  name: "fetch-arktype",
  description: "Fetch the content of a url (using ArkType)",
  parameters: type({
    url: "string",
  }),
  execute: async (args) => {
    return await fetchWebpageContent(args.url);
  },
});
```

**Valibot Example:**

Valibot requires the peer dependency @valibot/to-json-schema.

```typescript
import * as v from "valibot";

server.addTool({
  name: "fetch-valibot",
  description: "Fetch the content of a url (using Valibot)",
  parameters: v.object({
    url: v.string(),
  }),
  execute: async (args) => {
    return await fetchWebpageContent(args.url);
  },
});
```

#### Tools Without Parameters

When creating tools that don't require parameters, you have two options:

1. Omit the parameters property entirely:

   ```typescript
   server.addTool({
     name: "sayHello",
     description: "Say hello",
     // No parameters property
     execute: async () => {
       return "Hello, world!";
     },
   });
   ```

2. Explicitly define empty parameters:

   ```typescript
   import { z } from "zod";

   server.addTool({
     name: "sayHello",
     description: "Say hello",
     parameters: z.object({}), // Empty object
     execute: async () => {
       return "Hello, world!";
     },
   });
   ```

> [!NOTE]
>
> Both approaches are fully compatible with all MCP clients, including Cursor. FastMCP automatically generates the proper schema in both cases.

#### Tool Authorization

You can control which tools are available to authenticated users by adding an optional `canAccess` function to a tool's definition. This function receives the authentication context and should return `true` if the user is allowed to access the tool.

```typescript
server.addTool({
  name: "admin-tool",
  description: "An admin-only tool",
  canAccess: (auth) => auth?.role === "admin",
  execute: async () => "Welcome, admin!",
});
```

#### Returning a string

`execute` can return a string:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return "Hello, world!";
  },
});
```

The latter is equivalent to:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "text",
          text: "Hello, world!",
        },
      ],
    };
  },
});
```

#### Returning a list

If you want to return a list of messages, you can return an object with a `content` property:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        { type: "text", text: "First message" },
        { type: "text", text: "Second message" },
      ],
    };
  },
});
```

#### Returning an image

Use the `imageContent` to create a content object for an image:

```js
import { imageContent } from "fastmcp";

server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return imageContent({
      url: "https://example.com/image.png",
    });

    // or...
    // return imageContent({
    //   path: "/path/to/image.png",
    // });

    // or...
    // return imageContent({
    //   buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
    // });

    // or...
    // return {
    //   content: [
    //     await imageContent(...)
    //   ],
    // };
  },
});
```

The `imageContent` function takes the following options:

- `url`: The URL of the image.
- `path`: The path to the image file.
- `buffer`: The image data as a buffer.

Only one of `url`, `path`, or `buffer` must be specified.

The above example is equivalent to:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          mimeType: "image/png",
        },
      ],
    };
  },
});
```

#### Configurable Ping Behavior

FastMCP includes a configurable ping mechanism to maintain connection health. The ping behavior can be customized through server options:

```ts
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  ping: {
    // Explicitly enable or disable pings (defaults vary by transport)
    enabled: true,
    // Configure ping interval in milliseconds (default: 5000ms)
    intervalMs: 10000,
    // Set log level for ping-related messages (default: 'debug')
    logLevel: "debug",
  },
});
```

By default, ping behavior is optimized for each transport type:

- Enabled for SSE and HTTP streaming connections (which benefit from keep-alive)
- Disabled for `stdio` connections (where pings are typically unnecessary)

This configurable approach helps reduce log verbosity and optimize performance for different usage scenarios.

### Health-check Endpoint

When you run FastMCP with the `httpStream` transport you can optionally expose a
simple HTTP endpoint that returns a plain-text response useful for load-balancer
or container orchestration liveness checks.

Enable (or customise) the endpoint via the `health` key in the server options:

```ts
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  health: {
    // Enable / disable (default: true)
    enabled: true,
    // Body returned by the endpoint (default: 'ok')
    message: "healthy",
    // Path that should respond (default: '/health')
    path: "/healthz",
    // HTTP status code to return (default: 200)
    status: 200,
  },
});

await server.start({
  transportType: "httpStream",
  httpStream: { port: 8080 },
});
```

Now a request to `http://localhost:8080/healthz` will return:

```
HTTP/1.1 200 OK
content-type: text/plain

healthy
```

The endpoint is ignored when the server is started with the `stdio` transport.

#### Roots Management

FastMCP supports [Roots](https://modelcontextprotocol.io/docs/concepts/roots) - Feature that allows clients to provide a set of filesystem-like root locations that can be listed and dynamically updated. The Roots feature can be configured or disabled in server options:

```ts
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  roots: {
    // Set to false to explicitly disable roots support
    enabled: false,
    // By default, roots support is enabled (true)
  },
});
```

This provides the following benefits:

- Better compatibility with different clients that may not support Roots
- Reduced error logs when connecting to clients that don't implement roots capability
- More explicit control over MCP server capabilities
- Graceful degradation when roots functionality isn't available

You can listen for root changes in your server:

```ts
server.on("connect", (event) => {
  const session = event.session;

  // Access the current roots
  console.log("Initial roots:", session.roots);

  // Listen for changes to the roots
  session.on("rootsChanged", (event) => {
    console.log("Roots changed:", event.roots);
  });
});
```

When a client doesn't support roots or when roots functionality is explicitly disabled, these operations will gracefully handle the situation without throwing errors.

### Returning an audio

Use the `audioContent` to create a content object for an audio:

```js
import { audioContent } from "fastmcp";

server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return audioContent({
      url: "https://example.com/audio.mp3",
    });

    // or...
    // return audioContent({
    //   path: "/path/to/audio.mp3",
    // });

    // or...
    // return audioContent({
    //   buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
    // });

    // or...
    // return {
    //   content: [
    //     await audioContent(...)
    //   ],
    // };
  },
});
```

The `audioContent` function takes the following options:

- `url`: The URL of the audio.
- `path`: The path to the audio file.
- `buffer`: The audio data as a buffer.

Only one of `url`, `path`, or `buffer` must be specified.

The above example is equivalent to:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "audio",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          mimeType: "audio/mpeg",
        },
      ],
    };
  },
});
```

#### Return combination type

You can combine various types in this way and send them back to AI

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "text",
          text: "Hello, world!",
        },
        {
          type: "image",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          mimeType: "image/png",
        },
        {
          type: "audio",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          mimeType: "audio/mpeg",
        },
      ],
    };
  },

  // or...
  // execute: async (args) => {
  //   const imgContent = await imageContent({
  //     url: "https://example.com/image.png",
  //   });
  //   const audContent = await audioContent({
  //     url: "https://example.com/audio.mp3",
  //   });
  //   return {
  //     content: [
  //       {
  //         type: "text",
  //         text: "Hello, world!",
  //       },
  //       imgContent,
  //       audContent,
  //     ],
  //   };
  // },
});
```

#### Custom Logger

FastMCP allows you to provide a custom logger implementation to control how the server logs messages. This is useful for integrating with existing logging infrastructure or customizing log formatting.

```ts
import { FastMCP, Logger } from "fastmcp";

class CustomLogger implements Logger {
  debug(...args: unknown[]): void {
    console.log("[DEBUG]", new Date().toISOString(), ...args);
  }

  error(...args: unknown[]): void {
    console.error("[ERROR]", new Date().toISOString(), ...args);
  }

  info(...args: unknown[]): void {
    console.info("[INFO]", new Date().toISOString(), ...args);
  }

  log(...args: unknown[]): void {
    console.log("[LOG]", new Date().toISOString(), ...args);
  }

  warn(...args: unknown[]): void {
    console.warn("[WARN]", new Date().toISOString(), ...args);
  }
}

const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  logger: new CustomLogger(),
});
```

See `src/examples/custom-logger.ts` for examples with Winston, Pino, and file-based logging.

#### Logging

Tools can log messages to the client using the `log` object in the context object:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args, { log }) => {
    log.info("Downloading file...", {
      url,
    });

    // ...

    log.info("Downloaded file");

    return "done";
  },
});
```

The `log` object has the following methods:

- `debug(message: string, data?: SerializableValue)`
- `error(message: string, data?: SerializableValue)`
- `info(message: string, data?: SerializableValue)`
- `warn(message: string, data?: SerializableValue)`

#### Errors

The errors that are meant to be shown to the user should be thrown as `UserError` instances:

```js
import { UserError } from "fastmcp";

server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args) => {
    if (args.url.startsWith("https://example.com")) {
      throw new UserError("This URL is not allowed");
    }

    return "done";
  },
});
```

#### Progress

Tools can report progress by calling `reportProgress` in the context object:

```js
server.addTool({
  name: "download",
  description: "Download a file",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (args, { reportProgress }) => {
    await reportProgress({
      progress: 0,
      total: 100,
    });

    // ...

    await reportProgress({
      progress: 100,
      total: 100,
    });

    return "done";
  },
});
```

#### Streaming Output

FastMCP supports streaming partial results from tools while they're still executing, enabling responsive UIs and real-time feedback. This is particularly useful for:

- Long-running operations that generate content incrementally
- Progressive generation of text, images, or other media
- Operations where users benefit from seeing immediate partial results

To enable streaming for a tool, add the `streamingHint` annotation and use the `streamContent` method:

````js
server.addTool({
  name: "generateText",
  description: "Generate text incrementally",
  parameters: z.object({
    prompt: z.string(),
  }),
  annotations: {
    streamingHint: true, // Signals this tool uses streaming
    readOnlyHint: true,
  },
  execute: async (args, { streamContent }) => {
    // Send initial content immediately
    await streamContent({ type: "text", text: "Starting generation...\n" });

    // Simulate incremental content generation
    const words = "The quick brown fox jumps over the lazy dog.".split(" ");
    for (const word of words) {
      await streamContent({ type: "text", text: word + " " });
      await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate delay
    }

    // When using streamContent, you can:
    // 1. Return void (if all content was streamed)
    // 2. Return a final result (which will be appended to streamed content)

    // Option 1: All content was streamed, so return void
    return;

    // Option 2: Return final content that will be appended
    // return "Generation complete!";
  },
});

Streaming works with all content types (text, image, audio) and can be combined with progress reporting:

```js
server.addTool({
  name: "processData",
  description: "Process data with streaming updates",
  parameters: z.object({
    datasetSize: z.number(),
  }),
  annotations: {
    streamingHint: true,
  },
  execute: async (args, { streamContent, reportProgress }) => {
    const total = args.datasetSize;

    for (let i = 0; i < total; i++) {
      // Report numeric progress
      await reportProgress({ progress: i, total });

      // Stream intermediate results
      if (i % 10 === 0) {
        await streamContent({
          type: "text",
          text: `Processed ${i} of ${total} items...\n`,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    return "Processing complete!";
  },
});
````

#### Tool Annotations

As of the MCP Specification (2025-03-26), tools can include annotations that provide richer context and control by adding metadata about a tool's behavior:

```typescript
server.addTool({
  name: "fetch-content",
  description: "Fetch content from a URL",
  parameters: z.object({
    url: z.string(),
  }),
  annotations: {
    title: "Web Content Fetcher", // Human-readable title for UI display
    readOnlyHint: true, // Tool doesn't modify its environment
    openWorldHint: true, // Tool interacts with external entities
  },
  execute: async (args) => {
    return await fetchWebpageContent(args.url);
  },
});
```

The available annotations are:

| Annotation        | Type    | Default | Description                                                                                                                          |
| :---------------- | :------ | :------ | :----------------------------------------------------------------------------------------------------------------------------------- |
| `title`           | string  | -       | A human-readable title for the tool, useful for UI display                                                                           |
| `readOnlyHint`    | boolean | `false` | If true, indicates the tool does not modify its environment                                                                          |
| `destructiveHint` | boolean | `true`  | If true, the tool may perform destructive updates (only meaningful when `readOnlyHint` is false)                                     |
| `idempotentHint`  | boolean | `false` | If true, calling the tool repeatedly with the same arguments has no additional effect (only meaningful when `readOnlyHint` is false) |
| `openWorldHint`   | boolean | `true`  | If true, the tool may interact with an "open world" of external entities                                                             |

These annotations help clients and LLMs better understand how to use the tools and what to expect when calling them.

### Resources

[Resources](https://modelcontextprotocol.io/docs/concepts/resources) represent any kind of data that an MCP server wants to make available to clients. This can include:

- File contents
- Screenshots and images
- Log files
- And more

Each resource is identified by a unique URI and can contain either text or binary data.

```ts
server.addResource({
  uri: "file:///logs/app.log",
  name: "Application Logs",
  mimeType: "text/plain",
  async load() {
    return {
      text: await readLogFile(),
    };
  },
});
```

> [!NOTE]
>
> `load` can return multiple resources. This could be used, for example, to return a list of files inside a directory when the directory is read.
>
> ```ts
> async load() {
>   return [
>     {
>       text: "First file content",
>     },
>     {
>       text: "Second file content",
>     },
>   ];
> }
> ```

You can also return binary contents in `load`:

```ts
async load() {
  return {
    blob: 'base64-encoded-data'
  };
}
```

### Resource templates

You can also define resource templates:

```ts
server.addResourceTemplate({
  uriTemplate: "file:///logs/{name}.log",
  name: "Application Logs",
  mimeType: "text/plain",
  arguments: [
    {
      name: "name",
      description: "Name of the log",
      required: true,
    },
  ],
  async load({ name }) {
    return {
      text: `Example log content for ${name}`,
    };
  },
});
```

#### Resource template argument auto-completion

Provide `complete` functions for resource template arguments to enable automatic completion:

```ts
server.addResourceTemplate({
  uriTemplate: "file:///logs/{name}.log",
  name: "Application Logs",
  mimeType: "text/plain",
  arguments: [
    {
      name: "name",
      description: "Name of the log",
      required: true,
      complete: async (value) => {
        if (value === "Example") {
          return {
            values: ["Example Log"],
          };
        }

        return {
          values: [],
        };
      },
    },
  ],
  async load({ name }) {
    return {
      text: `Example log content for ${name}`,
    };
  },
});
```

### Embedded Resources

FastMCP provides a convenient `embedded()` method that simplifies including resources in tool responses. This feature reduces code duplication and makes it easier to reference resources from within tools.

#### Basic Usage

```js
server.addTool({
  name: "get_user_data",
  description: "Retrieve user information",
  parameters: z.object({
    userId: z.string(),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "resource",
          resource: await server.embedded(`user://profile/${args.userId}`),
        },
      ],
    };
  },
});
```

#### Working with Resource Templates

The `embedded()` method works seamlessly with resource templates:

```js
// Define a resource template
server.addResourceTemplate({
  uriTemplate: "docs://project/{section}",
  name: "Project Documentation",
  mimeType: "text/markdown",
  arguments: [
    {
      name: "section",
      required: true,
    },
  ],
  async load(args) {
    const docs = {
      "getting-started": "# Getting Started\n\nWelcome to our project!",
      "api-reference": "# API Reference\n\nAuthentication is required.",
    };
    return {
      text: docs[args.section] || "Documentation not found",
    };
  },
});

// Use embedded resources in a tool
server.addTool({
  name: "get_documentation",
  description: "Retrieve project documentation",
  parameters: z.object({
    section: z.enum(["getting-started", "api-reference"]),
  }),
  execute: async (args) => {
    return {
      content: [
        {
          type: "resource",
          resource: await server.embedded(`docs://project/${args.section}`),
        },
      ],
    };
  },
});
```

#### Working with Direct Resources

It also works with directly defined resources:

```js
// Define a direct resource
server.addResource({
  uri: "system://status",
  name: "System Status",
  mimeType: "text/plain",
  async load() {
    return {
      text: "System operational",
    };
  },
});

// Use in a tool
server.addTool({
  name: "get_system_status",
  description: "Get current system status",
  parameters: z.object({}),
  execute: async () => {
    return {
      content: [
        {
          type: "resource",
          resource: await server.embedded("system://status"),
        },
      ],
    };
  },
});
```

### Prompts

[Prompts](https://modelcontextprotocol.io/docs/concepts/prompts) enable servers to define reusable prompt templates and workflows that clients can easily surface to users and LLMs. They provide a powerful way to standardize and share common LLM interactions.

```ts
server.addPrompt({
  name: "git-commit",
  description: "Generate a Git commit message",
  arguments: [
    {
      name: "changes",
      description: "Git diff or description of changes",
      required: true,
    },
  ],
  load: async (args) => {
    return `Generate a concise but descriptive commit message for these changes:\n\n${args.changes}`;
  },
});
```

#### Prompt argument auto-completion

Prompts can provide auto-completion for their arguments:

```js
server.addPrompt({
  name: "countryPoem",
  description: "Writes a poem about a country",
  load: async ({ name }) => {
    return `Hello, ${name}!`;
  },
  arguments: [
    {
      name: "name",
      description: "Name of the country",
      required: true,
      complete: async (value) => {
        if (value === "Germ") {
          return {
            values: ["Germany"],
          };
        }

        return {
          values: [],
        };
      },
    },
  ],
});
```

#### Prompt argument auto-completion using `enum`

If you provide an `enum` array for an argument, the server will automatically provide completions for the argument.

```js
server.addPrompt({
  name: "countryPoem",
  description: "Writes a poem about a country",
  load: async ({ name }) => {
    return `Hello, ${name}!`;
  },
  arguments: [
    {
      name: "name",
      description: "Name of the country",
      required: true,
      enum: ["Germany", "France", "Italy"],
    },
  ],
});
```

### Authentication

FastMCP supports session-based authentication, allowing you to secure your server and control access to its features.

> [!NOTE]
> For more granular control over which tools are available to authenticated users, see the [Tool Authorization](#tool-authorization) section.

To enable authentication, provide an `authenticate` function in the server options. This function receives the incoming HTTP request and should return a promise that resolves with the authentication context.

If authentication fails, the function should throw a `Response` object, which will be sent to the client.

```ts
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  authenticate: (request) => {
    const apiKey = request.headers["x-api-key"];

    if (apiKey !== "123") {
      throw new Response(null, {
        status: 401,
        statusText: "Unauthorized",
      });
    }

    // Whatever you return here will be accessible in the `context.session` object.
    return {
      id: 1,
    };
  },
});
```

Now you can access the authenticated session data in your tools:

```ts
server.addTool({
  name: "sayHello",
  execute: async (args, { session }) => {
    return `Hello, ${session.id}!`;
  },
});
```

#### Tool Authorization

You can control which tools are available to authenticated users by adding an optional `canAccess` function to a tool's definition. This function receives the authentication context and should return `true` if the user is allowed to access the tool.

If `canAccess` is not provided, the tool is accessible to all authenticated users by default. If no authentication is configured on the server, all tools are available to all clients.

**Example:**

```typescript
const server = new FastMCP<{ role: "admin" | "user" }>({
  authenticate: async (request) => {
    const role = request.headers["x-role"] as string;
    return { role: role === "admin" ? "admin" : "user" };
  },
  name: "My Server",
  version: "1.0.0",
});

server.addTool({
  name: "admin-dashboard",
  description: "An admin-only tool",
  // Only users with the 'admin' role can see and execute this tool
  canAccess: (auth) => auth?.role === "admin",
  execute: async () => {
    return "Welcome to the admin dashboard!";
  },
});

server.addTool({
  name: "public-info",
  description: "A tool available to everyone",
  execute: async () => {
    return "This is public information.";
  },
});
```

In this example, only clients authenticating with the `admin` role will be able to list or call the `admin-dashboard` tool. The `public-info` tool will be available to all authenticated users.

#### OAuth Support

FastMCP includes built-in support for OAuth discovery endpoints, supporting both **MCP Specification 2025-03-26** and **MCP Specification 2025-06-18** for OAuth integration. This makes it easy to integrate with OAuth authorization flows by providing standard discovery endpoints that comply with RFC 8414 (OAuth 2.0 Authorization Server Metadata) and RFC 9470 (OAuth 2.0 Protected Resource Metadata):

```ts
import { FastMCP } from "fastmcp";
import { buildGetJwks } from "get-jwks";
import fastJwt from "fast-jwt";

const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  oauth: {
    enabled: true,
    authorizationServer: {
      issuer: "https://auth.example.com",
      authorizationEndpoint: "https://auth.example.com/oauth/authorize",
      tokenEndpoint: "https://auth.example.com/oauth/token",
      jwksUri: "https://auth.example.com/.well-known/jwks.json",
      responseTypesSupported: ["code"],
    },
    protectedResource: {
      resource: "mcp://my-server",
      authorizationServers: ["https://auth.example.com"],
    },
  },
  authenticate: async (request) => {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new Response(null, {
        status: 401,
        statusText: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Validate OAuth JWT access token using OpenID Connect discovery
    try {
      // TODO: Cache the discovery document to avoid repeated requests
      // Discover OAuth/OpenID configuration from well-known endpoint
      const discoveryUrl =
        "https://auth.example.com/.well-known/openid-configuration";
      // Alternative: Use OAuth authorization server metadata endpoint
      // const discoveryUrl = 'https://auth.example.com/.well-known/oauth-authorization-server';

      const discoveryResponse = await fetch(discoveryUrl);
      if (!discoveryResponse.ok) {
        throw new Error("Failed to fetch OAuth discovery document");
      }

      const config = await discoveryResponse.json();
      const jwksUri = config.jwks_uri;
      const issuer = config.issuer;

      // Create JWKS client for token verification using discovered endpoint
      const getJwks = buildGetJwks({
        jwksUrl: jwksUri,
        cache: true,
        rateLimit: true,
      });

      // Create JWT verifier with JWKS and discovered issuer
      const verify = fastJwt.createVerifier({
        key: async (token) => {
          const { header } = fastJwt.decode(token, { complete: true });
          const jwk = await getJwks.getJwk({
            kid: header.kid,
            alg: header.alg,
          });
          return jwk;
        },
        algorithms: ["RS256", "ES256"],
        issuer: issuer,
        audience: "mcp://my-server",
      });

      // Verify the JWT token
      const payload = await verify(token);

      return {
        userId: payload.sub,
        scope: payload.scope,
        email: payload.email,
        // Include other claims as needed
      };
    } catch (error) {
      throw new Response(null, {
        status: 401,
        statusText: "Invalid OAuth token",
      });
    }
  },
});
```

This configuration automatically exposes OAuth discovery endpoints:

- `/.well-known/oauth-authorization-server` - Authorization server metadata (RFC 8414)
- `/.well-known/oauth-protected-resource` - Protected resource metadata (RFC 9470)

For JWT token validation, you can use libraries like [`get-jwks`](https://github.com/nearform/get-jwks) and [`@fastify/jwt`](https://github.com/fastify/fastify-jwt) for OAuth JWT tokens.

#### Passing Headers Through Context

If you are exposing your MCP server via HTTP, you may wish to allow clients to supply sensitive keys via headers, which can then be passed along to APIs that your tools interact with, allowing each client to supply their own API keys. This can be done by capturing the HTTP headers in the `authenticate` section and storing them in the session to be referenced by the tools later.

```ts
import { FastMCP } from "fastmcp";
import { IncomingHttpHeaders } from "http";

// Define the session data type
interface SessionData {
  headers: IncomingHttpHeaders;
  [key: string]: unknown; // Add index signature to satisfy Record<string, unknown>
}

// Create a server instance
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  authenticate: async (request: any): Promise<SessionData> => {
    // Authentication logic
    return {
      headers: request.headers,
    };
  },
});

// Tool to display HTTP headers
server.addTool({
  name: "headerTool",
  description: "Reads HTTP headers from the request",
  execute: async (args: any, context: any) => {
    const session = context.session as SessionData;
    const headers = session?.headers ?? {};

    const getHeaderString = (header: string | string[] | undefined) =>
      Array.isArray(header) ? header.join(", ") : (header ?? "N/A");

    const userAgent = getHeaderString(headers["user-agent"]);
    const authorization = getHeaderString(headers["authorization"]);
    return `User-Agent: ${userAgent}\nAuthorization: ${authorization}\nAll Headers: ${JSON.stringify(headers, null, 2)}`;
  },
});

// Start the server
server.start({
  transportType: "httpStream",
  httpStream: {
    port: 8080,
  },
});
```

A client that would connect to this may look something like this:

```ts
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const transport = new StreamableHTTPClientTransport(
  new URL(`http://localhost:8080/mcp`),
  {
    requestInit: {
      headers: {
        Authorization: "Test 123",
      },
    },
  },
);

const client = new Client({
  name: "example-client",
  version: "1.0.0",
});

(async () => {
  await client.connect(transport);

  // Call a tool
  const result = await client.callTool({
    name: "headerTool",
    arguments: {
      arg1: "value",
    },
  });

  console.log("Tool result:", result);
})().catch(console.error);
```

What would show up in the console after the client runs is something like this:

```
Tool result: {
  content: [
    {
      type: 'text',
      text: 'User-Agent: node\n' +
        'Authorization: Test 123\n' +
        'All Headers: {\n' +
        '  "host": "localhost:8080",\n' +
        '  "connection": "keep-alive",\n' +
        '  "authorization": "Test 123",\n' +
        '  "content-type": "application/json",\n' +
        '  "accept": "application/json, text/event-stream",\n' +
        '  "accept-language": "*",\n' +
        '  "sec-fetch-mode": "cors",\n' +
        '  "user-agent": "node",\n' +
        '  "accept-encoding": "gzip, deflate",\n' +
        '  "content-length": "163"\n' +
        '}'
    }
  ]
}
```

### Providing Instructions

You can provide instructions to the server using the `instructions` option:

```ts
const server = new FastMCP({
  name: "My Server",
  version: "1.0.0",
  instructions:
    'Instructions describing how to use the server and its features.\n\nThis can be used by clients to improve the LLM\'s understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.',
});
```

### Sessions

The `session` object is an instance of `FastMCPSession` and it describes active client sessions.

```ts
server.sessions;
```

We allocate a new server instance for each client connection to enable 1:1 communication between a client and the server.

### Typed server events

You can listen to events emitted by the server using the `on` method:

```ts
server.on("connect", (event) => {
  console.log("Client connected:", event.session);
});

server.on("disconnect", (event) => {
  console.log("Client disconnected:", event.session);
});
```

## `FastMCPSession`

`FastMCPSession` represents a client session and provides methods to interact with the client.

Refer to [Sessions](#sessions) for examples of how to obtain a `FastMCPSession` instance.

### `requestSampling`

`requestSampling` creates a [sampling](https://modelcontextprotocol.io/docs/concepts/sampling) request and returns the response.

```ts
await session.requestSampling({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: "What files are in the current directory?",
      },
    },
  ],
  systemPrompt: "You are a helpful file system assistant.",
  includeContext: "thisServer",
  maxTokens: 100,
});
```

#### Options

`requestSampling` accepts an optional second parameter for request options:

```ts
await session.requestSampling(
  {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "What files are in the current directory?",
        },
      },
    ],
    systemPrompt: "You are a helpful file system assistant.",
    includeContext: "thisServer",
    maxTokens: 100,
  },
  {
    // Progress callback - called when progress notifications are received
    onprogress: (progress) => {
      console.log(`Progress: ${progress.progress}/${progress.total}`);
    },

    // Abort signal for cancelling the request
    signal: abortController.signal,

    // Request timeout in milliseconds (default: DEFAULT_REQUEST_TIMEOUT_MSEC)
    timeout: 30000,

    // Whether progress notifications reset the timeout (default: false)
    resetTimeoutOnProgress: true,

    // Maximum total timeout regardless of progress (no default)
    maxTotalTimeout: 60000,
  },
);
```

**Options:**

- `onprogress?: (progress: Progress) => void` - Callback for progress notifications from the remote end
- `signal?: AbortSignal` - Abort signal to cancel the request
- `timeout?: number` - Request timeout in milliseconds
- `resetTimeoutOnProgress?: boolean` - Whether progress notifications reset the timeout
- `maxTotalTimeout?: number` - Maximum total timeout regardless of progress notifications

### `clientCapabilities`

The `clientCapabilities` property contains the client capabilities.

```ts
session.clientCapabilities;
```

### `loggingLevel`

The `loggingLevel` property describes the logging level as set by the client.

```ts
session.loggingLevel;
```

### `roots`

The `roots` property contains the roots as set by the client.

```ts
session.roots;
```

### `server`

The `server` property contains an instance of MCP server that is associated with the session.

```ts
session.server;
```

### Typed session events

You can listen to events emitted by the session using the `on` method:

```ts
session.on("rootsChanged", (event) => {
  console.log("Roots changed:", event.roots);
});

session.on("error", (event) => {
  console.error("Error:", event.error);
});
```

## Running Your Server

### Test with `mcp-cli`

The fastest way to test and debug your server is with `fastmcp dev`:

```bash
npx fastmcp dev server.js
npx fastmcp dev server.ts
```

This will run your server with [`mcp-cli`](https://github.com/wong2/mcp-cli) for testing and debugging your MCP server in the terminal.

### Inspect with `MCP Inspector`

Another way is to use the official [`MCP Inspector`](https://modelcontextprotocol.io/docs/tools/inspector) to inspect your server with a Web UI:

```bash
npx fastmcp inspect server.ts
```

## FAQ

### How to use with Claude Desktop?

Follow the guide https://modelcontextprotocol.io/quickstart/user and add the following configuration:

```json
{
  "mcpServers": {
    "my-mcp-server": {
      "command": "npx",
      "args": ["tsx", "/PATH/TO/YOUR_PROJECT/src/index.ts"],
      "env": {
        "YOUR_ENV_VAR": "value"
      }
    }
  }
}
```

### How to run FastMCP behind a proxy?

Refer to this [issue](https://github.com/punkpeye/fastmcp/issues/25#issuecomment-3004568732) for an example of using FastMCP with `express` and `http-proxy-middleware`.

## Showcase

> [!NOTE]
>
> If you've developed a server using FastMCP, please [submit a PR](https://github.com/punkpeye/fastmcp) to showcase it here!

> [!NOTE]
>
> If you are looking for a boilerplate repository to build your own MCP server, check out [fastmcp-boilerplate](https://github.com/punkpeye/fastmcp-boilerplate).

- [apinetwork/piapi-mcp-server](https://github.com/apinetwork/piapi-mcp-server) - generate media using Midjourney/Flux/Kling/LumaLabs/Udio/Chrip/Trellis
- [domdomegg/computer-use-mcp](https://github.com/domdomegg/computer-use-mcp) - controls your computer
- [LiterallyBlah/Dradis-MCP](https://github.com/LiterallyBlah/Dradis-MCP) – manages projects and vulnerabilities in Dradis
- [Meeting-Baas/meeting-mcp](https://github.com/Meeting-Baas/meeting-mcp) - create meeting bots, search transcripts, and manage recording data
- [drumnation/unsplash-smart-mcp-server](https://github.com/drumnation/unsplash-smart-mcp-server) – enables AI agents to seamlessly search, recommend, and deliver professional stock photos from Unsplash
- [ssmanji89/halopsa-workflows-mcp](https://github.com/ssmanji89/halopsa-workflows-mcp) - HaloPSA Workflows integration with AI assistants
- [aiamblichus/mcp-chat-adapter](https://github.com/aiamblichus/mcp-chat-adapter) – provides a clean interface for LLMs to use chat completion
- [eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master) – advanced AI project/task manager powered by FastMCP
- [cswkim/discogs-mcp-server](https://github.com/cswkim/discogs-mcp-server) - connects to the Discogs API for interacting with your music collection
- [Panzer-Jack/feuse-mcp](https://github.com/Panzer-Jack/feuse-mcp) - Frontend Useful MCP Tools - Essential utilities for web developers to automate API integration and code generation
- [sunra-ai/sunra-clients](https://github.com/sunra-ai/sunra-clients/tree/main/mcp-server) - Sunra.ai is a generative media platform built for developers, providing high-performance AI model inference capabilities.
- [foxtrottwist/shortcuts-mcp](https://github.com/foxtrottwist/shortcuts-mcp) - connects Claude to macOS Shortcuts for system automation, app integration, and interactive workflows

## Acknowledgements

- FastMCP is inspired by the [Python implementation](https://github.com/jlowin/fastmcp) by [Jonathan Lowin](https://github.com/jlowin).
- Parts of codebase were adopted from [LiteMCP](https://github.com/wong2/litemcp).
- Parts of codebase were adopted from [Model Context protocolでSSEをやってみる](https://dev.classmethod.jp/articles/mcp-sse/).
