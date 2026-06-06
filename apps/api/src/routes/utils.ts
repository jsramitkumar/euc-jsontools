import type { FastifyPluginAsync } from "fastify";
import { validateJson, analyzeJson } from "../services/compare-engine.js";

export const utilRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/v1/beautify
  app.post("/beautify", {
    schema: {
      tags: ["Utils"],
      summary: "Beautify / pretty-print JSON",
      body: {
        type: "object",
        required: ["json"],
        properties: {
          json: { type: "string" },
          indent: { type: "number", default: 2 },
        },
      },
    },
    handler: async (request, reply) => {
      const { json, indent = 2 } = request.body as { json: string; indent?: number };
      const { isValid, parsed, errors } = validateJson(json);

      if (!isValid) {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_JSON", message: errors[0] },
        });
      }

      return reply.send({
        success: true,
        data: { result: JSON.stringify(parsed, null, indent), isValid: true },
      });
    },
  });

  // POST /api/v1/validate
  app.post("/validate", {
    schema: {
      tags: ["Utils"],
      summary: "Validate JSON",
      body: {
        type: "object",
        required: ["json"],
        properties: { json: { type: "string" } },
      },
    },
    handler: async (request, reply) => {
      const { json } = request.body as { json: string };
      const { isValid, parsed, errors } = validateJson(json);

      const stats = isValid ? analyzeJson(parsed) : null;

      return reply.send({
        success: true,
        data: { isValid, errors, stats },
      });
    },
  });

  // POST /api/v1/minify
  app.post("/minify", {
    schema: {
      tags: ["Utils"],
      summary: "Minify JSON",
      body: {
        type: "object",
        required: ["json"],
        properties: { json: { type: "string" } },
      },
    },
    handler: async (request, reply) => {
      const { json } = request.body as { json: string };
      const { isValid, parsed, errors } = validateJson(json);

      if (!isValid) {
        return reply.status(400).send({
          success: false,
          error: { code: "INVALID_JSON", message: errors[0] },
        });
      }

      const minified = JSON.stringify(parsed);
      const originalSize = Buffer.byteLength(json, "utf8");
      const minifiedSize = Buffer.byteLength(minified, "utf8");

      return reply.send({
        success: true,
        data: {
          result: minified,
          originalSize,
          minifiedSize,
          reductionPercent: Math.round((1 - minifiedSize / originalSize) * 100),
        },
      });
    },
  });
};
