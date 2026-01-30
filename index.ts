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
            const { totalHashrate, totalGophers, bestDifficulty, blockHeight } =
                await response.json();

            // Format hashrate
            let formattedHashrate = "";
            let unit = "";
            if (totalHashrate > 1e9) {
                formattedHashrate = `${(totalHashrate / 1e9).toPrecision(3)}`;
                unit = "Ph/s";
            } else if (totalHashrate > 1e6) {
                formattedHashrate = `${(totalHashrate / 1e6).toPrecision(3)}`;
                unit = "Th/s";
            } else if (totalHashrate > 1000) {
                formattedHashrate = `${(totalHashrate / 1000).toPrecision(3)}`;
                unit = "Gh/s";
            } else {
                formattedHashrate = `${totalHashrate.toPrecision(3)}`;
                unit = "Mh/s";
            }

            // format best diff
            let bestDiff = bestDifficulty.toPrecision(3);
            let diffUnit = "Kilo";
            if (bestDifficulty >= 1e12) {
                bestDiff = `${(bestDifficulty / 1e12).toPrecision(3)}`;
                diffUnit = "Peta";
            } else if (bestDifficulty >= 1e9) {
                bestDiff = `${(bestDifficulty / 1e9).toPrecision(3)}`;
                diffUnit = "Tera";
            } else if (bestDifficulty >= 1e6) {
                bestDiff = `${(bestDifficulty / 1e6).toPrecision(3)}`;
                diffUnit = "Giga";
            } else if (bestDifficulty >= 1000) {
                bestDiff = `${(bestDifficulty / 1000).toPrecision(3)}`;
                diffUnit = "Mega";
            }

            // Return widget data
            // umbrelOS expects strings for all fields of four-stats
            return Response.json({
                type: "four-stats",
                refresh: "5s",
                items: [
                    {
                        title: "Hashrate",
                        text: formattedHashrate,
                        subtext: unit,
                    },
                    { title: "Gophers", text: totalGophers.toString() },
                    {
                        title: "Height",
                        text: blockHeight.toString(),
                    },
                    {
                        title: "Best Share",
                        text: bestDiff,
                        subtext: diffUnit,
                    },
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
                    { title: "Hashrate", text: "?" },
                    { title: "Gophers", text: "?" },
                    { title: "Height", text: "?" },
                    { title: "Best Share", text: "?" },
                ],
            });
        }
    },
});
