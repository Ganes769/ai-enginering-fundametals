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
      "Modify an existing element in canvas by id. Set only the field you want to change and everything else please leave it",
    inputSchema: z.object({
      elementId: z.string().describe("The id of the element to modify"),
      updates: z
        .object({
          x: z.number().nullable().describe("New x position, or null"),
          y: z.number().nullable().describe("New y position, or null"),
          width: z.number().nullable().describe("New width, or null"),
          height: z.number().nullable().describe("New height, or null"),
          text: z
            .string()
            .nullable()
            .describe("New label or text content, or null"),
          fontSize: z.number().nullable(),
          textAlign: z.enum(["left", "center", "right"]).nullable(),
          strokeColor: z
            .string()
            .nullable()
            .describe("Hex stroke color, or null"),
          backgroundColor: z
            .string()
            .nullable()
            .describe("Hex fill color, or null"),
          fillStyle: z.enum(["solid", "hachure", "cross-hatch"]).nullable(),
          strokeWidth: z.number().nullable(),
          roughness: z.number().nullable(),
          opacity: z.number().nullable(),
        })
        .describe(
          "Fields to change. Set any field you don't want to touch to null.",
        ),
    }),
  }),
  execute: async ({ elementId, updates }: any) => {
    return { elementId, updates };
  },
};
