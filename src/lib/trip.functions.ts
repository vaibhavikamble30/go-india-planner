import { createServerFn } from "@tanstack/react-start";
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const PlanInput = z.object({
  origin: z.string(),
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

const TravelOptionSchema = z.object({
  mode: z.string(),
  name: z.string(),
  departure: z.string(),
  arrival: z.string(),
  duration: z.string(),
  estimatedCost: z.string(),
});

const TravelSchema = z.object({
  mode: z.string(),
  details: z.string(),
  duration: z.string(),
  estimatedCost: z.string(),
  options: z.array(TravelOptionSchema),
});

const ItinerarySchema = z.object({
  origin: z.string(),
  city: z.string(),
  summary: z.string(),
  travelThere: TravelSchema,
  travelBack: TravelSchema,
  days: z.array(DaySchema),
});

export type Itinerary = z.infer<typeof ItinerarySchema>;

export const planTrip = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlanInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const prompt = `Plan a ${data.days}-day trip from ${data.origin} to ${data.city}, India with a budget of approximately Rs ${data.budget} per person per day.
Include travel details for getting from ${data.origin} to ${data.city} (travelThere) and the return journey (travelBack): best mode of transport (train/flight/bus/car), specific route or named trains/airports, journey duration and estimated one-way cost like "Rs 1,800".
For each direction also give 2-4 concrete "options". Prefer real trains first: for a train option set mode to "Train" and name to the train number and name (e.g. "12958 Ahd SBC Express"), with departure and arrival as clock times like "06:35" plus the station, e.g. "06:35 - Delhi (NDLS)". If no direct train exists on that route, say so in details and give bus/private travels operators (e.g. "VRL Travels sleeper"), flights (with flight numbers/airlines) or cab options instead, still with departure and arrival times. Only list services that plausibly exist on this route; keep timings realistic and note they should be reconfirmed.
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
