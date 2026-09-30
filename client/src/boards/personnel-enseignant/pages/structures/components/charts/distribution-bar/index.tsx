import ChartWrapper from "../../../../../../../components/chart-wrapper";
import { createDistributionBarOptions, DistributionSegment } from "./options";

interface DistributionBarChartProps {
    id: string;
    title: string;
    segments: DistributionSegment[];
    description: string;
}

export default function DistributionBarChart({
    id,
    title,
    segments,
    description,
}: DistributionBarChartProps) {
    if (!segments.some((s) => s.value > 0)) return null;

    const options = createDistributionBarOptions(segments, title);
    (options as any).accessibility = {
        ...((options as any).accessibility || {}),
        description,
    };

    return (
        <ChartWrapper
            config={{
                id,
                title: { fr: title, size: "h2" as const, look: "h6" as const },
            }}
            options={options}
        />
    );
}
