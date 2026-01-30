// Validate environment variable at startup
if (!process.env.POGOLO_API_URL) {
    throw new Error("POGOLO_API_URL environment variable is not set");
}

const POGOLO_API_URL = process.env.POGOLO_API_URL + "/api/v1/info";

Bun.serve({
    async fetch(request) {
        // Check if the request is for the correct endpoint
        const url = new URL(request.url);
        if (url.pathname !== "/widgets/pool") {
            return Response.json(
                { error: "Invalid endpoint. Please use /widgets/pool" },
                { status: 404 },
            );
        }

        try {
            // Get current pool stats from /api/v1/info
            const response = await fetch(POGOLO_API_URL);
            const { totalHashrate, totalGophers, bestDifficulty, blocksFound } =
                await response.json();

            // Format hashrate
            let rate = totalHashrate;
            const units = ["MH/s", "GH/s", "TH/s", "PH/s", "EH/s"];
            let unitIndex = 0;
            while (rate >= 1000 && unitIndex < units.length - 1) {
                rate /= 1000;
                unitIndex++;
            }
            const unit = units[unitIndex];

            // format best diff
            let bestDiff = "";
            if (bestDifficulty >= 1e12) {
                bestDiff = `${(bestDifficulty / 1e12).toPrecision(5)}T`
            } else if (bestDifficulty >= 1e9) {
                bestDiff = `${(bestDifficulty / 1e9).toPrecision(5)}G`
            } else if (bestDifficulty >= 1e6) {
                bestDiff = `${(bestDifficulty / 1e6).toPrecision(5)}M`
            } else if (bestDifficulty >= 1000) {
                bestDiff = `${(bestDifficulty / 1000).toPrecision(5)}k`
            }

            // Return widget data
            // umbrelOS expects strings for all fields of four-stats
            return Response.json({
                type: "four-stats",
                refresh: "5s",
                items: [
                    {
                        title: "Pool Hashrate",
                        text: rate.toFixed(2),
                        subtext: unit,
                    },
                    { title: "Gophers", text: totalGophers.toString() },
                    {
                        title: "Blocks Found",
                        text: blocksFound.length.toString(),
                    },
                    { title: "Best Difficulty", text: bestDiff },
                ],
            });
        } catch (error) {
            // Log the full error details for server-side debugging
            console.error("Error handling request:", error);

            // Return a formatted response with placeholders, otherwise the widget will show without any titles
            return Response.json({
                type: "four-stats",
                refresh: "5s",
                items: [
                    { title: "Pool Hashrate", text: "?" },
                    { title: "Gophers", text: "?" },
                    { title: "Blocks Found", text: "?" },
                    { title: "Best Difficulty", text: "?" },
                ],
            });
        }
    },
});
