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

        const locale =
            request.headers.get("Accept-Language")?.split(",")[0].trim() ||
            "en";
        const heightfmt = new Intl.NumberFormat(locale);

        const fmt = new Intl.NumberFormat(locale, {
            maximumSignificantDigits: 3,
        });
        try {
            // Get current pool stats from /api/v1/info
            const response = await fetch(POGOLO_API_URL);
            const { totalHashrate, totalGophers, bestDifficulty, blockHeight } =
                await response.json();

            // Format hashrate
            let formattedHashrate = "";
            let unit = "";
            if (totalHashrate > 1e9) {
                formattedHashrate = `${fmt.format(totalHashrate / 1e9)}`;
                unit = "Ph/s";
            } else if (totalHashrate > 1e6) {
                formattedHashrate = `${fmt.format(totalHashrate / 1e6)}`;
                unit = "Th/s";
            } else if (totalHashrate > 1000) {
                formattedHashrate = `${fmt.format(totalHashrate / 1000)}`;
                unit = "Gh/s";
            } else {
                formattedHashrate = `${fmt.format(totalHashrate)}`;
                unit = "Mh/s";
            }

            // format best diff
            let formattedBestDiff = "";
            let diffUnit = "";
            if (bestDifficulty >= 1e15) {
                diffUnit = "Peta";
            }  else if (bestDifficulty >= 1e12) {
                formattedBestDiff = `${fmt.format(bestDifficulty / 1e12)}`;
                diffUnit = "Tera";
            } else if (bestDifficulty >= 1e9) {
                formattedBestDiff = `${fmt.format(bestDifficulty / 1e9)}`;
                diffUnit = "Giga";
            } else if (bestDifficulty >= 1e6) {
                formattedBestDiff = `${fmt.format(bestDifficulty / 1e6)}`;
                diffUnit = "Mega";
            } else if (bestDifficulty >= 1000) {
                formattedBestDiff = `${fmt.format(bestDifficulty / 1000)}`;
                diffUnit = "Kilo";
            } else {
                formattedBestDiff = `${fmt.format(bestDifficulty)}`;
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
                    { title: "Gophers", text: fmt.format(totalGophers) },
                    {
                        title: "Height",
                        text: heightfmt.format(blockHeight),
                    },
                    {
                        title: "Best Share",
                        text: formattedBestDiff,
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
