import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function PublicListPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let list: any = null;
    let items: any[] = [];

    try {
        const lists = await prisma.$queryRawUnsafe<any[]>(`
            SELECT l.id, l.name, l."profileId", p.name as "profileName"
            FROM "UserList" l
            JOIN "profile" p ON p.id = l."profileId"
            WHERE l."shareSlug" = $1 AND l."isPublic" = TRUE
        `, slug);
        list = lists[0] ?? null;

        if (list) {
            items = await prisma.$queryRawUnsafe<any[]>(`
                SELECT m.id, m.title, m."thumbnailUrl", m.rating, m.year, m.type
                FROM "UserListItem" i
                JOIN "movie" m ON m.id = i."movieId"
                WHERE i."listId" = $1
                ORDER BY i."createdAt" DESC
            `, list.id);
        }
    } catch {}

    if (!list) {
        return <div style={{ color: "white", padding: "120px", textAlign: "center" }}>Lista no encontrada o no es pública</div>;
    }

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 1.5rem", color: "white" }}>
            <div style={{ marginBottom: "2rem" }}>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", letterSpacing: "1px", textTransform: "uppercase", fontWeight: "700" }}>
                    Lista pública por {list.profileName}
                </div>
                <h1 style={{ fontSize: "2.4rem", fontWeight: "900", marginTop: "6px" }}>{list.name}</h1>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginTop: "4px" }}>
                    {items.length} título{items.length !== 1 ? "s" : ""}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
                {items.map((m: any) => {
                    const href = (m.type === "SERIE" || m.type === "ANIME") ? `/series/${m.id}` : `/title/${m.id}`;
                    return (
                        <Link key={m.id} href={href} style={{ textDecoration: "none", color: "white" }}>
                            <div style={{ aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", background: "#1e293b", marginBottom: "8px" }}>
                                <img src={m.thumbnailUrl} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <div style={{ fontSize: "0.88rem", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>{m.year} · ★ {m.rating}</div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
