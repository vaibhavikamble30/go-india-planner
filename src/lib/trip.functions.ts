import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const PlanInput = z.object({
  city: z.string(),
  days: z.number(),
  budget: z.number(),
});

const DaySchema = z.object({
  day: z.number(),
  title: z.string(),
  morning: z.string(),
  afternoon: z.string(),
  evening: z.string(),
  food: z.string(),
  estimatedCost: z.string(),
});

const ItinerarySchema = z.object({
  city: z.string(),
  summary: z.string(),
  days: z.array(DaySchema),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;

export const planTrip = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Plan a ${data.days}-day trip to ${data.city}, India with a budget of approximately Rs ${data.budget} per person per day.
Return exactly ${data.days} days. For each day give a short catchy title, a morning activity, an afternoon activity, an evening activity, food recommendations (2-3 named local dishes or eateries), and an estimated cost for that day written like "Rs 2,400".
Keep each field to one or two concise sentences. Use real, well-known places in ${data.city}. Keep the total daily cost close to the stated budget. Write a one-sentence summary of the whole trip.`;

    try {
      const { output } = await generateText({
        model: gateway("google/gemini-3.6-flash"),
        output: Output.object({ schema: ItinerarySchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        const match = error.text.match(/\{[\s\S]*\}/);
        if (match) return ItinerarySchema.parse(JSON.parse(match[0]));
      }
      throw error;
    }
  });
