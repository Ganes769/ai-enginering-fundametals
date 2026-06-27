import { tool } from "ai";
import z from "zod";
export const tools = {
  generateDiagram: tool({
    description:
      "Generate a complete diagram as an array of Excalidraw elements. Use this when the user asks you to create, draw, or design a new diagram. Return all elements needed including text labels, shapes, and arrow lines connecting them.",
    inputSchema: z.object({
      elements: z
        .array(
          z.object({
            id: z.string().describe("Unique Identifier"),
            type: z.enum([
              "rectangle",
              "ellipse",
              "diamond",
              "line",
              "arrow",
              "text",
            ]),
            x: z.number().describe("X Position"),
            y: z.number().describe("Y Position"),
            height: z.number().describe("Height"),
            width: z.number().describe("Width"),
            strokeColor: z
              .string()
              .default("#1e1e1e")
              .describe("Stroke Color (hex)"),
            backgroundColor: z
              .string()
              .default("transparent")
              .describe("Fill color"),
            fillStyle: z
              .enum(["solid", "hachure", "cross-hatch"])
              .default("solid"),
            strokeWidth: z.number().default(2),
            roughness: z
              .number()
              .default(1)
              .describe("0 for clean 1 for sketchy"),
            opacity: z.number().default(100),
            text: z.string().optional().describe("Text content"),
            fontSize: z.number().default(20),
            points: z
              .array(z.array(z.number()))
              .optional()
              .describe(
                "Array of [x,y] points (for arrow/line elements). Each point is a two number array.",
              ),
            startBinding: z
              .object({
                elementId: z.string(),
                focus: z.number(),
                gap: z.number(),
              })
              .optional()
              .describe("Bind arrow start to an element"),
            endBinding: z
              .object({
                elementId: z.string(),
                focus: z.number(),
                gap: z.number(),
              })
              .optional()
              .describe("Bind arrow end to an element"),
            textAlign: z.enum(["left", "center", "right"]).default("center"),
          }),
        )
        .optional()
        .describe("Binding information for element"),
    }),
    execute: async ({ elements }) => {
      return { elements };
    },
  }),
  modifyDiagram: tool({
    description:
      "Modify an existing element on the canvas by id. Include ONLY the fields you want to change in `updates`. Omit any field you do not want to touch — do not send null.",
    inputSchema: z.object({
      elementId: z.string().describe("The id of the element to modify"),
      updates: z
        .object({
          x: z.number().optional().describe("New x position"),
          y: z.number().optional().describe("New y position"),
          width: z.number().optional().describe("New width"),
          height: z.number().optional().describe("New height"),
          text: z.string().optional().describe("New label or text content"),
          fontSize: z.number().optional(),
          textAlign: z.enum(["left", "center", "right"]).optional(),
          strokeColor: z.string().optional().describe("Hex stroke color"),
          backgroundColor: z.string().optional().describe("Hex fill color"),
          fillStyle: z.enum(["solid", "hachure", "cross-hatch"]).optional(),
          strokeWidth: z.number().optional(),
          roughness: z.number().optional(),
          opacity: z.number().optional(),
        })
        .describe(
          "Object containing only the fields to change. Omit unchanged fields entirely.",
        ),
    }),
    execute: async ({ elementId, updates }) => {
      return { elementId, updates };
    },
  }),
};
