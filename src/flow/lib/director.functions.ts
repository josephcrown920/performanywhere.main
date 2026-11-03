import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  logline: z.string().min(8, "Give the director a little more story"),
  style: z.string().min(1),
});

export const generateShotList = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { directShotList } = await import("@/flow/lib/director.server");
    return directShotList(data.logline, data.style);
  });
