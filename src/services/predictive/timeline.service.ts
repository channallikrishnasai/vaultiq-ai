import { predictionEngine, type PredictionInput, type TimelineEvent } from "./prediction-engine";

export const timelineService = {
  async getTimeline(input: PredictionInput): Promise<TimelineEvent[]> {
    return predictionEngine.generateTimeline(input);
  },

  getTimelineByHorizon(events: TimelineEvent[], days: number): TimelineEvent[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return events.filter((e) => new Date(e.date) <= cutoff);
  },

  getTimelineByType(events: TimelineEvent[], type: TimelineEvent["type"]): TimelineEvent[] {
    return events.filter((e) => e.type === type);
  },
};
