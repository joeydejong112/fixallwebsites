import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Id } from "@/convex/_generated/dataModel";
import { createClerkClient } from "@clerk/nextjs/server";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0c0c14",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#eeeaf8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  logoSite: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#eeeaf8" },
  logoPurple: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#7c6aff" },
  logo: { flexDirection: "row" },
  date: { fontSize: 10, color: "rgba(238,234,248,0.4)" },
  heroSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    padding: 20,
    backgroundColor: "#131220",
    borderRadius: 12,
  },
  url: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#eeeaf8", marginBottom: 6 },
  subtitle: { fontSize: 10, color: "rgba(238,234,248,0.4)" },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#7c6aff",
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNum: { fontSize: 24, fontFamily: "Helvetica-Bold", color: "#eeeaf8" },
  scoreLabel: { fontSize: 8, color: "rgba(238,234,248,0.4)" },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#eeeaf8", marginBottom: 10, marginTop: 20 },
  pillarsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  pillarBox: {
    width: 80,
    height: 56,
    backgroundColor: "#131220",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  pillarLabel: { fontSize: 8, color: "rgba(238,234,248,0.5)", textTransform: "uppercase", marginBottom: 2 },
  pillarScore: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#eeeaf8" },
  issueCard: {
    marginBottom: 6,
    padding: 10,
    backgroundColor: "#131220",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  badge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    textTransform: "uppercase",
  },
  badgeFail: { backgroundColor: "rgba(248,113,113,0.15)", color: "#f87171" },
  badgeWarn: { backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  badgePass: { backgroundColor: "rgba(110,231,183,0.15)", color: "#6ee7b7" },
  issueName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#eeeaf8", marginBottom: 2 },
  issueDesc: { fontSize: 8, color: "rgba(238,234,248,0.5)", lineHeight: 1.4 },
  footer: { marginTop: 32, textAlign: "center", fontSize: 9, color: "rgba(238,234,248,0.25)" },
});

const PILLAR_COLORS: Record<string, string> = {
  seo: "#a89dff",
  security: "#f87171",
  performance: "#f59e0b",
  accessibility: "#6ee7b7",
  technical: "#60a5fa",
  mobile: "#e879f9",
};

function scoreColor(score: number): string {
  if (score >= 80) return "#6ee7b7";
  if (score >= 60) return "#f59e0b";
  return "#f87171";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify plan
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const clerkUser = await clerk.users.getUser(userId);
  const plan = (clerkUser.publicMetadata?.plan as string) ?? "free";
  if (plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { scanId } = await params;
  const data = await fetchQuery(api.scanQueries.getFullScanForExport, {
    scanId: scanId as Id<"scans">,
  });

  if (!data || !data.scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  const { scan, results } = data;
  const pillarScores = scan.pillarScores as Record<string, number> | undefined;
  const PILLARS = ["seo", "security", "performance", "accessibility", "technical", "mobile"];

  const failResults = results.filter((r) => r.status === "fail");
  const warnResults = results.filter((r) => r.status === "warn");
  const displayResults = [...failResults, ...warnResults].slice(0, 30);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoSite}>site</Text>
            <Text style={styles.logoPurple}>fix</Text>
          </View>
          <Text style={styles.date}>
            {new Date(scan.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </Text>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.url}>{scan.url}</Text>
            <Text style={styles.subtitle}>Website Health Report — SiteFix</Text>
          </View>
          <View style={styles.scoreCircle}>
            <Text style={{ ...styles.scoreNum, color: scoreColor(scan.overallScore ?? 0) }}>
              {scan.overallScore ?? 0}
            </Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
        </View>

        {/* Pillar Scores */}
        {pillarScores && (
          <>
            <Text style={styles.sectionTitle}>Pillar Scores</Text>
            <View style={styles.pillarsRow}>
              {PILLARS.map((pillar) => {
                const s = pillarScores[pillar] ?? 0;
                return (
                  <View key={pillar} style={styles.pillarBox}>
                    <Text style={{ ...styles.pillarLabel, color: PILLAR_COLORS[pillar] ?? "#7c6aff" }}>
                      {pillar}
                    </Text>
                    <Text style={{ ...styles.pillarScore, color: scoreColor(s) }}>{s}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Issues */}
        <Text style={styles.sectionTitle}>Issues Requiring Attention ({displayResults.length})</Text>
        {displayResults.map((result, idx) => (
          <View key={idx} style={styles.issueCard} wrap={false}>
            <View style={{ flexShrink: 0 }}>
              <Text
                style={[
                  styles.badge,
                  result.status === "fail" ? styles.badgeFail : result.status === "warn" ? styles.badgeWarn : styles.badgePass,
                ]}
              >
                {result.status}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.issueName}>{result.checkName}</Text>
              <Text style={styles.issueDesc}>{result.plainEnglishDescription}</Text>
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by SiteFix — Website Health Scanner. Results as of{" "}
          {new Date(scan.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
        </Text>
      </Page>
    </Document>
  );

  const pdfBuffer = await renderToBuffer(doc);
  const body = new Uint8Array(pdfBuffer);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sitefix-report-${scanId}.pdf"`,
    },
  });
}
