import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sunrise, Sun, Moon, UtensilsCrossed, Wallet, MapPin, Loader2, ArrowLeft } from "lucide-react";
import { planTrip, type Itinerary } from "@/lib/trip.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Safar — AI Trip Planner for India" },
      {
        name: "description",
        content:
          "Plan a day-by-day India itinerary in seconds. Enter your city, days and daily budget for activities, food picks and costs.",
      },
      { property: "og:title", content: "Safar — AI Trip Planner for India" },
      {
        property: "og:description",
        content: "Day-by-day India itineraries with activities, food and estimated costs.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [city, setCity] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("2500");
  const [trip, setTrip] = useState<Itinerary | null>(null);

  const planTripFn = useServerFn(planTrip);
  const mutation = useMutation({
    mutationFn: (vars: { city: string; days: number; budget: number }) =>
      planTripFn({ data: vars }),
    onSuccess: (data) => setTrip(data),
  });

  if (trip) {
    return <ItineraryView trip={trip} onBack={() => setTrip(null)} />;
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium tracking-wide text-accent-foreground uppercase">
            <MapPin className="h-3 w-3" /> Incredible India
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
            Plan your <span className="text-primary">safar</span>.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Tell us where you're headed and we'll build a day-by-day itinerary that fits your budget.
          </p>
        </div>

        <form
          className="space-y-5 rounded-2xl border border-border bg-card p-6"
          style={{ boxShadow: "var(--shadow-soft)" }}
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({
              city: city.trim(),
              days: Math.max(1, Math.min(10, Number(days) || 1)),
              budget: Math.max(200, Number(budget) || 1000),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              required
              placeholder="Jaipur, Kochi, Varanasi…"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days">Number of days</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={10}
                required
                value={days}
                onChange={(e) => setDays(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget / day (₹)</Label>
              <Input
                id="budget"
                type="number"
                min={200}
                step={100}
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Planning your trip…
              </>
            ) : (
              "Plan my trip"
            )}
          </Button>

          {mutation.isError && (
            <p className="text-center text-sm text-destructive">
              Couldn't plan that trip right now. Please try again.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

function ItineraryView({ trip, onBack }: { trip: Itinerary; onBack: () => void }) {
  return (
    <main className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Plan another trip
        </button>

        <header className="mt-6 rounded-2xl p-6 text-primary-foreground" style={{ background: "var(--gradient-warm)" }}>
          <p className="text-xs font-medium tracking-widest uppercase opacity-90">
            {trip.days.length} day itinerary
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{trip.city}</h1>
          <p className="mt-3 text-sm opacity-95">{trip.summary}</p>
        </header>

        <div className="mt-6 space-y-5">
          {trip.days.map((day) => (
            <article
              key={day.day}
              className="rounded-2xl border border-border bg-card p-5 sm:p-6"
              style={{ boxShadow: "var(--shadow-soft)" }}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {day.day}
                </span>
                <h2 className="min-w-0 text-lg font-semibold text-foreground">{day.title}</h2>
              </div>

              <div className="mt-5 space-y-4">
                <Slot icon={<Sunrise className="h-4 w-4" />} label="Morning" text={day.morning} />
                <Slot icon={<Sun className="h-4 w-4" />} label="Afternoon" text={day.afternoon} />
                <Slot icon={<Moon className="h-4 w-4" />} label="Evening" text={day.evening} />
                <Slot icon={<UtensilsCrossed className="h-4 w-4" />} label="Food" text={day.food} />
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm">
                <Wallet className="h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">Estimated cost</span>
                <span className="ml-auto font-semibold text-foreground">{day.estimatedCost}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function Slot({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}
