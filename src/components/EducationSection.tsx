import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

export function EducationSection() {
  const lessons = [
    {
      title: "APR vs Interest Rate",
      description: "Why APR includes fees and matters more than the sticker rate.",
      content: "APR (Annual Percentage Rate) includes all loan costs - interest, fees, and charges - giving you the true cost of borrowing."
    },
    {
      title: "Snowball vs Avalanche",
      description: "Behavioral wins vs mathematical optimal — pick what you'll stick to.",
      content: "Snowball builds momentum by paying smallest debts first. Avalanche saves money by targeting highest interest rates first."
    },
    {
      title: "Predatory Patterns",
      description: "Teaser rates, add‑ons, payment packing — how to spot and avoid.",
      content: "Watch for: rates that jump after intro periods, pre-checked insurance add-ons, and excessive origination fees."
    }
  ];

  return (
    <section id="education" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Learn by seeing</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Micro‑lessons that make compounding and amortization click.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson.title} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-base">{lesson.title}</CardTitle>
                <CardDescription>{lesson.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-3">{lesson.content}</div>
                <div className="mt-3 rounded-xl border p-4 bg-muted/30">
                  <div className="text-xs text-muted-foreground text-center">
                    Interactive visual demonstration
                    <br />
                    <span className="italic">(Coming in future update)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
